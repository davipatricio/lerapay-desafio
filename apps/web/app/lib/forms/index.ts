import { createFormHook } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { fieldContext, formContext, useFieldContext, useFormContext } from './hooks';
import { FormField } from './components';

/**
 * App-level TanStack Form hook with the shadcn field component wired in.
 */
const { useAppForm, withForm, withFieldGroup, useTypedAppFormContext, extendForm } = createFormHook(
  {
    fieldContext,
    formContext,
    fieldComponents: { FormField },
    formComponents: {},
  },
);

export {
  useAppForm,
  withForm,
  withFieldGroup,
  useTypedAppFormContext,
  extendForm,
  useFieldContext,
  useFormContext,
  FormField,
};

/**
 * Zod validator configured for the form (TanStack Form <=> zod v4 adapter).
 */
export const formValidator = zodValidator();
