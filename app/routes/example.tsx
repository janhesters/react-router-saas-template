import { parseSubmission, report, useForm } from "@conform-to/react/future";
import { coerceFormValue } from "@conform-to/zod/v4/future";
import { parseFormData } from "@remix-run/form-data-parser";
import { data, Form } from "react-router";
import * as z from "zod";

import type { Route } from "./+types/example";

const updateSchema = z.object({
  image: z
    .file()
    .mime(["image/png", "image/jpeg", "image/jpg", "image/webp"])
    .optional(),
  intent: z.literal("update"),
});

const deleteSchema = z.object({
  intent: z.literal("delete"),
});

const schema = coerceFormValue(
  z.discriminatedUnion("intent", [updateSchema, deleteSchema]),
);

export async function action({ request }: Route.ActionArgs) {
  const formData = await parseFormData(request);
  const submission = parseSubmission(formData);
  const result = schema.safeParse(submission.payload);

  if (!result.success) {
    return data(
      {
        result: report(submission, {
          error: { issues: result.error.issues },
        }),
        success: false,
        type: undefined,
      },
      {
        status: 400,
      },
    );
  }

  if (result.data.intent === "delete") {
    return { result: undefined, success: true, type: "delete" as const };
  }

  return { result: undefined, success: true, type: "update" as const };
}

function UpdateForm({
  actionData,
}: {
  actionData?: Route.ComponentProps["actionData"];
}) {
  const { form, fields } = useForm({
    lastResult: actionData?.result,
    schema: coerceFormValue(updateSchema),
  });

  return (
    <Form
      className="flex flex-col gap-4"
      encType="multipart/form-data"
      method="POST"
      {...form.props}
    >
      <input type="file" {...fields.image.inputProps} />

      <button name="intent" type="submit" value="update">
        Update
      </button>

      {fields.image.errors && (
        <p className="text-red-500" id={fields.image.errorId}>
          {fields.image.errors.join(", ")}
        </p>
      )}
    </Form>
  );
}

function DeleteForm({
  actionData,
}: {
  actionData?: Route.ComponentProps["actionData"];
}) {
  const { form } = useForm({
    lastResult: actionData?.result,
    schema: deleteSchema,
  });

  return (
    <Form className="flex flex-col gap-4" method="POST" {...form.props}>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded"
        name="intent"
        type="submit"
        value="delete"
      >
        Delete
      </button>
    </Form>
  );
}

export default function Example({ actionData }: Route.ComponentProps) {
  return (
    <main className="p-4">
      <div className="mx-auto max-w-sm space-y-8">
        <div>
          <h2 className="font-bold mb-4">Update Form</h2>
          <UpdateForm actionData={actionData} />
          {actionData?.success && actionData.type === "update" && (
            <p className="text-green-500 mt-2">
              Update submitted successfully!
            </p>
          )}
        </div>

        <div>
          <h2 className="font-bold mb-4">Delete Form</h2>
          <DeleteForm actionData={actionData} />
          {actionData?.success && actionData.type === "delete" && (
            <p className="text-green-500 mt-2">
              Delete submitted successfully!
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
