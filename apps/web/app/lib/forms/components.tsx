import type { ReactNode } from 'react';
import { useFieldContext } from './hooks';
import { Label } from '@/components/ui/label';

export interface FormFieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  children: (field: ReturnType<typeof useFieldContext<any>>) => ReactNode;
}

/**
 * Reusable field wrapper bound to the TanStack Form field context.
 * Consumers receive the typed field api as a render prop to wire the control.
 */
export function FormField({ label, hint, children }: FormFieldProps) {
  const field = useFieldContext<any>();

  const { meta } = field.state;
  const showError = meta.isTouched && meta.errors.length > 0;

  return (
    <div className="flex flex-col gap-2">
      {label ? <Label htmlFor={field.name}>{label}</Label> : null}
      {children(field)}
      {showError ? (
        <p className="text-sm text-destructive">{meta.errors[0]?.message ?? 'Valor inválido'}</p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
