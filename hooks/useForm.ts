import { zodResolver } from "@hookform/resolvers/zod";
import { useForm as useFormHook } from "react-hook-form";
import { z } from "zod";
import { fetch } from "services/http";
import { FormEvent, useCallback, useEffect, useState } from "react";

export const useForm = <T = any>(
  url: string,
  defaultValues: Record<string, unknown>,
  schema: z.Schema<any, any>
) => {
  const [loading, setLoading] = useState(false);
  const form = useFormHook({
    defaultValues,
    resolver: zodResolver(schema),
  });

  const methodSwitch = useCallback(
    (method: "POST" | "PATCH" | "GET" | "DELETE" = "GET") =>
      async (e: FormEvent<HTMLFormElement>): Promise<T> => {
        let body = {};
        await form.handleSubmit(
          (values) => {
            body = values;
          },
          () => {
            throw { type: "validation" };
          }
        )(e);
        setLoading(true);
        return fetch<T>(url, {
          method,
          body,
        }).finally(setLoading.bind(null, false));
      },
    [form.handleSubmit]
  );

  useEffect(() => {
    if (
      form.formState.errors &&
      Object.keys(form.formState.errors).length > 0
    ) {
      form.setFocus(Object.keys(form.formState.errors)[0]);
    }
  }, [form.formState.errors]);

  return {
    ...form,
    errors: form.formState.errors,
    post: methodSwitch("POST"),
    get: methodSwitch("GET"),
    patch: methodSwitch("PATCH"),
    delete: methodSwitch("DELETE"),
    loading,
  };
};
