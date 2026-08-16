import { createFormHookContexts } from '@tanstack/react-form';

/**
 * Shared field/form contexts for the app-level form hook.
 */
const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

export { fieldContext, formContext, useFieldContext, useFormContext };
