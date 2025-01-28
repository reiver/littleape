import { zodResolver } from "@hookform/resolvers/zod";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useForm as useFormHook } from "react-hook-form";
import { fetcher } from "services/http";
import { z } from "zod";

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
      async (
        e?: FormEvent<HTMLFormElement>,
        parser?: (values: typeof defaultValues) => Promise<typeof defaultValues>
      ): Promise<T> => {
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
        return fetcher<T>(url, {
          method,
          body: parser ? await parser(body) : body,
        }).finally(setLoading.bind(null, false));
      },
    [form.handleSubmit]
  );

  useEffect(() => {
    if (
      form.formState.errors &&
      Object.keys(form.formState.errors).length > 0 &&
      form.formState.errors[Object.keys(form.formState.errors)[0]].ref
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
