package com.warehouse.backend.security;

import com.warehouse.backend.config.JwtProperties;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Service
public class JwtTokenService {

    private static final MacAlgorithm ALGORITHM = MacAlgorithm.HS256;
    private static final String AUTHORITIES_CLAIM = "authorities";
    private static final String TOKEN_TYPE_CLAIM = "token_type";
    private static final String ACCESS_TOKEN_TYPE = "access";
    private static final String REFRESH_TOKEN_TYPE = "refresh";

    private final JwtEncoder encoder;
    private final JwtDecoder decoder;
    private final long expirationSeconds;
    private final long refreshExpirationSeconds;

    public JwtTokenService(JwtProperties properties) {
        SecretKeySpec secretKey = buildSecretKey(properties.secret());

        this.encoder = new NimbusJwtEncoder(new ImmutableSecret<>(secretKey));
        this.decoder = NimbusJwtDecoder.withSecretKey(secretKey).macAlgorithm(ALGORITHM).build();
        this.expirationSeconds = properties.expirationSeconds();
        this.refreshExpirationSeconds = properties.refreshExpirationSeconds();
    }

    /**
     * Generates a short-lived access token for the given authenticated principal.
     * Carries {@code sub}, {@code authorities}, and {@code token_type=access}.
     */
    public String generateToken(Authentication authentication) {
        Instant now = Instant.now();
        List<String> authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .sorted()
                .toList();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(authentication.getName())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(expirationSeconds))
                .claim(TOKEN_TYPE_CLAIM, ACCESS_TOKEN_TYPE)
                .claim(AUTHORITIES_CLAIM, authorities)
                .build();

        return encode(claims);
    }

    /**
     * Generates a long-lived refresh token for the given subject.
     * Only carries {@code sub} and {@code token_type=refresh} — no authorities.
     */
    public String generateRefreshToken(String subject) {
        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(subject)
                .issuedAt(now)
                .expiresAt(now.plusSeconds(refreshExpirationSeconds))
                .claim(TOKEN_TYPE_CLAIM, REFRESH_TOKEN_TYPE)
                .build();

        return encode(claims);
    }

    /**
     * Validates the given refresh token (signature + expiry + type claim) and
     * returns the subject. Throws {@link IllegalArgumentException} if invalid.
     */
    public String extractSubjectFromRefreshToken(String token) {
        Jwt jwt;
        try {
            jwt = decoder.decode(token);
        } catch (JwtException e) {
            throw new IllegalArgumentException("Invalid refresh token: " + e.getMessage(), e);
        }

        String type = jwt.getClaimAsString(TOKEN_TYPE_CLAIM);
        if (!REFRESH_TOKEN_TYPE.equals(type)) {
            throw new IllegalArgumentException("Token is not a refresh token.");
        }

        return jwt.getSubject();
    }

    public JwtDecoder decoder() {
        return decoder;
    }

    public long expirationSeconds() {
        return expirationSeconds;
    }

    public long refreshExpirationSeconds() {
        return refreshExpirationSeconds;
    }

    private String encode(JwtClaimsSet claims) {
        return encoder.encode(
                JwtEncoderParameters.from(JwsHeader.with(ALGORITHM).build(), claims)
        ).getTokenValue();
    }

    /**
     * Pads or truncates the secret to exactly 32 bytes so HS256 always has
     * a valid 256-bit key regardless of the configured string length.
     */
    private static SecretKeySpec buildSecretKey(String secret) {
        byte[] raw = secret.getBytes(StandardCharsets.UTF_8);
        byte[] key = Arrays.copyOf(raw, Math.max(raw.length, 32));
        return new SecretKeySpec(key, "HmacSHA256");
    }
}
