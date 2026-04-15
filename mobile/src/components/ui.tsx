import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'

export const palette = {
  ink: '#172033',
  muted: '#66748f',
  line: '#d7deea',
  surface: '#ffffff',
  background: '#f3f7fb',
  primary: '#0b7fab',
  primaryDark: '#075f82',
  accent: '#f97316',
  success: '#15803d',
  danger: '#c62828',
}

export function Screen({
  title,
  subtitle,
  right,
  children,
}: React.PropsWithChildren<{ title: string; subtitle?: string; right?: React.ReactNode }>) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{subtitle ?? 'StockFlow Mobile'}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        {right ? <View>{right}</View> : null}
      </View>
      {children}
    </ScrollView>
  )
}

export function Card({
  title,
  action,
  children,
}: React.PropsWithChildren<{ title?: string; action?: React.ReactNode }>) {
  return (
    <View style={styles.card}>
      {title || action ? (
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          {action}
        </View>
      ) : null}
      {children}
    </View>
  )
}

export function Button({
  label,
  variant = 'primary',
  onPress,
  disabled,
}: {
  label: string
  variant?: 'primary' | 'secondary' | 'danger'
  onPress: () => void
  disabled?: boolean
}) {
  const backgroundColor =
    variant === 'secondary' ? '#eef5fb' : variant === 'danger' ? '#fee2e2' : palette.primary
  const color = variant === 'secondary' ? palette.primaryDark : variant === 'danger' ? palette.danger : '#ffffff'

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
    </Pressable>
  )
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  keyboardType,
}: {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  multiline?: boolean
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'url'
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline ? styles.multilineInput : null]}
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  )
}

export function SwitchField({
  label,
  value,
  onValueChange,
}: {
  label: string
  value: boolean
  onValueChange: (value: boolean) => void
}) {
  return (
    <View style={styles.switchRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  )
}

type PickerOption<T extends string | number> = {
  label: string
  value: T
}

export function PickerField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
}: {
  label: string
  value: T | null
  options: PickerOption<T>[]
  onChange: (value: T) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const active = useMemo(() => options.find((option) => option.value === value), [options, value])

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text style={active ? styles.inputValue : styles.placeholderText}>{active?.label ?? placeholder}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {options.map((option) => (
                <Pressable
                  key={String(option.value)}
                  style={styles.optionRow}
                  onPress={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button label="Close" variant="secondary" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  )
}

export function MultiSelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T[]
  options: PickerOption<T>[]
  onChange: (value: T[]) => void
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.checkboxGrid}>
        {options.map((option) => {
          const active = value.includes(option.value)
          return (
            <Pressable
              key={String(option.value)}
              style={[styles.checkboxPill, active ? styles.checkboxPillActive : null]}
              onPress={() =>
                onChange(active ? value.filter((item) => item !== option.value) : [...value, option.value])
              }
            >
              <Text style={[styles.checkboxText, active ? styles.checkboxTextActive : null]}>{option.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export function InlineStats({ stats }: { stats: Array<{ label: string; value: string }> }) {
  return (
    <View style={styles.statsGrid}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.statBox}>
          <Text style={styles.statLabel}>{stat.label}</Text>
          <Text style={styles.statValue}>{stat.value}</Text>
        </View>
      ))}
    </View>
  )
}

export function LoadingBlock({ label = 'Loading...' }: { label?: string }) {
  return (
    <View style={styles.loadingBlock}>
      <ActivityIndicator color={palette.primary} />
      <Text style={styles.helper}>{label}</Text>
    </View>
  )
}

export function EmptyState({ label }: { label: string }) {
  return <Text style={styles.helper}>{label}</Text>
}

export function Paginator({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <View style={styles.paginator}>
      <Button label="Previous" variant="secondary" onPress={onPrev} disabled={page <= 0} />
      <Text style={styles.helper}>
        Page {page + 1} of {Math.max(totalPages, 1)}
      </Text>
      <Button label="Next" variant="secondary" onPress={onNext} disabled={page + 1 >= totalPages} />
    </View>
  )
}

export function ListRow({
  title,
  subtitle,
  meta,
  actions,
}: {
  title: string
  subtitle?: string
  meta?: string
  actions?: React.ReactNode
}) {
  return (
    <View style={styles.listRow}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.listTitle}>{title}</Text>
        {subtitle ? <Text style={styles.listSubtitle}>{subtitle}</Text> : null}
        {meta ? <Text style={styles.listMeta}>{meta}</Text> : null}
      </View>
      {actions ? <View style={styles.rowActions}>{actions}</View> : null}
    </View>
  )
}

export function ModalForm({
  visible,
  title,
  onClose,
  children,
}: React.PropsWithChildren<{ visible: boolean; title: string; onClose: () => void }>) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Screen title={title} right={<Button label="Close" variant="secondary" onPress={onClose} />}>
        {children}
      </Screen>
    </Modal>
  )
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  screenContent: { padding: 20, gap: 16, paddingBottom: 36 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1, gap: 6 },
  eyebrow: { color: palette.primaryDark, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: palette.ink, fontSize: 28, fontWeight: '800' },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.line,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: palette.ink },
  button: { minHeight: 42, paddingHorizontal: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 14, fontWeight: '700' },
  field: { gap: 8 },
  fieldLabel: { color: palette.ink, fontWeight: '700', fontSize: 14 },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: '#fdfefe',
    paddingHorizontal: 14,
    justifyContent: 'center',
    color: palette.ink,
  },
  multilineInput: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  placeholderText: { color: '#93a1b7' },
  inputValue: { color: palette.ink },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: { minWidth: '47%', backgroundColor: '#f8fbfe', borderRadius: 16, padding: 14, gap: 6 },
  statLabel: { color: palette.muted, fontSize: 12 },
  statValue: { color: palette.ink, fontWeight: '800', fontSize: 20 },
  helper: { color: palette.muted, fontSize: 14 },
  loadingBlock: { alignItems: 'center', gap: 10, paddingVertical: 20 },
  paginator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  listRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
    gap: 12,
  },
  listTitle: { fontSize: 16, fontWeight: '700', color: palette.ink },
  listSubtitle: { fontSize: 14, color: palette.muted },
  listMeta: { fontSize: 13, color: palette.primaryDark },
  rowActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10, 19, 34, 0.25)',
  },
  modalCard: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: palette.ink },
  optionRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
  },
  optionText: { color: palette.ink, fontSize: 16 },
  checkboxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  checkboxPill: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  checkboxPillActive: { backgroundColor: '#dbf0ff', borderColor: '#9ecdf0' },
  checkboxText: { color: palette.ink },
  checkboxTextActive: { color: palette.primaryDark, fontWeight: '700' },
})
