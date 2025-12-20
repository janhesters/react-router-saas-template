import { IconChevronDown } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { TFunction } from "i18next";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TbChevronLeft,
  TbChevronRight,
  TbChevronsLeft,
  TbChevronsRight,
  TbCircleCheckFilled,
  TbLoader,
} from "react-icons/tb";
import { useFetcher } from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";

import { CHANGE_ROLE_INTENT } from "./team-members-constants";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { OrganizationMembership, UserAccount } from "~/generated/browser";
import { OrganizationMembershipRole } from "~/generated/browser";

export type Member = {
  avatar: UserAccount["imageUrl"];
  deactivatedAt?: OrganizationMembership["deactivatedAt"];
  email: UserAccount["email"];
  id: UserAccount["id"];
  isCurrentUser?: boolean;
  name: UserAccount["name"];
  role: OrganizationMembership["role"];
  status:
    | "createdTheOrganization"
    | "emailInvitePending"
    | "joinedViaEmailInvite"
    | "joinedViaLink";
};

type RoleSwitcherProps = {
  currentUserIsOwner: boolean;
  member: Member;
};

function RoleSwitcher({ currentUserIsOwner, member }: RoleSwitcherProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "settings.teamMembers.table.roleSwitcher",
  });

  const [open, setOpen] = useState(false);
  const fetcher = useFetcher();
  const role =
    (fetcher.formData?.get("role") as string) ||
    (member.deactivatedAt ? "deactivated" : member.role);
  const hydrated = useHydrated();

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            className="w-36 justify-between"
            // Playwright shouldn't try to click the button before it's hydrated
            disabled={!hydrated}
            size="sm"
            variant="outline"
          />
        }
      >
        {/* @ts-expect-error - role is a dynamic string (member/admin/owner/deactivated) */}
        {t(role)}

        <IconChevronDown
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
      </PopoverTrigger>

      <PopoverContent align="end" className="p-0">
        <fetcher.Form
          method="POST"
          onSubmit={() => {
            setOpen(false);
          }}
        >
          <input name="userId" type="hidden" value={member.id} />
          <input name="intent" type="hidden" value={CHANGE_ROLE_INTENT} />

          <Command label={t("commandLabel")}>
            <CommandInput placeholder={t("rolesPlaceholder")} />

            <CommandList>
              <CommandEmpty>{t("noRolesFound")}</CommandEmpty>

              <CommandGroup>
                <CommandItem className="teamaspace-y-1 flex flex-col items-start p-0">
                  <button
                    className="px-4 py-2 text-start"
                    name="role"
                    type="submit"
                    value={OrganizationMembershipRole.member}
                  >
                    <p>{t("member")}</p>

                    <p className="text-muted-foreground text-sm">
                      {t("memberDescription")}
                    </p>
                  </button>
                </CommandItem>

                <CommandItem className="teamaspace-y-1 flex flex-col items-start p-0">
                  <button
                    className="px-4 py-2 text-start"
                    name="role"
                    type="submit"
                    value={OrganizationMembershipRole.admin}
                  >
                    <p>{t("admin")}</p>

                    <p className="text-muted-foreground text-sm">
                      {t("adminDescription")}
                    </p>
                  </button>
                </CommandItem>

                {currentUserIsOwner && (
                  <CommandItem className="teamaspace-y-1 flex flex-col items-start p-0">
                    <button
                      className="px-4 py-2 text-start"
                      name="role"
                      type="submit"
                      value={OrganizationMembershipRole.owner}
                    >
                      <p>{t("owner")}</p>

                      <p className="text-muted-foreground text-sm">
                        {t("ownerDescription")}
                      </p>
                    </button>
                  </CommandItem>
                )}

                <CommandSeparator />

                <CommandItem className="teamaspace-y-1 flex flex-col items-start p-0">
                  <button
                    className="px-4 py-2 text-start"
                    name="role"
                    type="submit"
                    value="deactivated"
                  >
                    <p>{t("deactivated")}</p>

                    <p className="text-muted-foreground text-sm">
                      {t("deactivatedDescription")}
                    </p>
                  </button>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </fetcher.Form>
      </PopoverContent>
    </Popover>
  );
}

const createColumns = ({
  currentUsersRole,
  t,
}: {
  currentUsersRole: OrganizationMembership["role"];
  t: TFunction<"organizations", "settings.teamMembers.table">;
}): ColumnDef<Member>[] => [
  {
    accessorKey: "avatar",
    cell: ({ row }) => {
      return (
        <Avatar>
          <AvatarImage alt={row.original.name} src={row.original.avatar} />
          <AvatarFallback>
            {row.original.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      );
    },
    header: () => <div className="sr-only">{t("avatarHeader")}</div>,
  },
  {
    accessorKey: "name",
    cell: ({ row }) => {
      return <div className="font-medium text-sm">{row.original.name}</div>;
    },
    header: t("nameHeader"),
  },
  {
    accessorKey: "email",
    header: t("emailHeader"),
  },
  {
    accessorKey: "status",
    cell: ({ row }) => {
      return (
        <Badge
          className="px-1.5 font-normal text-muted-foreground"
          variant="outline"
        >
          {row.original.status === "emailInvitePending" ? (
            <TbLoader />
          ) : (
            <TbCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
          )}
          {t(`status.${row.original.status}`)}
        </Badge>
      );
    },
    header: t("statusHeader"),
  },
  {
    accessorKey: "role",
    cell: ({ row }) =>
      // Hide the role switcher if:
      // 1. Its the current user's own role (can't change your own role)
      row.original.isCurrentUser ||
      // 2. If the current user is a member (members can't change roles)
      currentUsersRole === "member" ||
      // 3. If the current user is an admin and the row is an owner (admins
      // can't change owners' roles)
      (currentUsersRole === "admin" && row.original.role === "owner") ||
      // 4. If the member is pending email invite (can't change roles of pending invites)
      row.original.status === "emailInvitePending" ? (
        <div className="text-muted-foreground">
          {row.original.deactivatedAt
            ? t("roleSwitcher.deactivated")
            : t(`roleSwitcher.${row.original.role}`)}
        </div>
      ) : (
        <RoleSwitcher
          currentUserIsOwner={
            currentUsersRole === OrganizationMembershipRole.owner
          }
          member={row.original}
        />
      ),
    header: t("roleHeader"),
  },
];

export type TeamMembersTableProps = {
  currentUsersRole: OrganizationMembership["role"];
  members: Member[];
};

export function TeamMembersTable({
  currentUsersRole,
  members,
}: TeamMembersTableProps) {
  const { t } = useTranslation("organizations", {
    keyPrefix: "settings.teamMembers.table",
  });

  const columns = useMemo(
    () => createColumns({ currentUsersRole, t }),
    [currentUsersRole, t],
  );

  const table = useReactTable({
    columns,
    data: members,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const hydrated = useHydrated();

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 rounded-lg bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? undefined
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody className="**:data-[slot=table-cell]:font-light **:data-[slot=table-cell]:last:w-40 **:data-[slot=table-cell]:first:w-12">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  {t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4">
        <div className="hidden items-center gap-2 lg:flex">
          <Label className="font-medium text-sm" htmlFor="rows-per-page">
            {t("pagination.rowsPerPage")}
          </Label>

          <Select
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
            value={`${table.getState().pagination.pageSize}`}
          >
            <SelectTrigger
              className="w-20"
              // Playwright shouldn't try to click the dropdown before it's hydrated
              disabled={!hydrated}
              id="rows-per-page"
              size="sm"
            >
              <SelectValue
                placeholder={String(table.getState().pagination.pageSize)}
              />
            </SelectTrigger>

            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="flex w-fit items-center justify-center font-medium text-sm">
            {t("pagination.pageInfo", {
              current: table.getState().pagination.pageIndex + 1,
              total: table.getPageCount(),
            })}
          </div>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              className="hidden h-8 w-8 p-0 lg:flex"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.setPageIndex(0)}
              variant="outline"
            >
              <span className="sr-only">{t("pagination.goToFirst")}</span>
              <TbChevronsLeft />
            </Button>

            <Button
              className="size-8"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              size="icon"
              variant="outline"
            >
              <span className="sr-only">{t("pagination.goToPrevious")}</span>
              <TbChevronLeft />
            </Button>

            <Button
              className="size-8"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              size="icon"
              variant="outline"
            >
              <span className="sr-only">{t("pagination.goToNext")}</span>
              <TbChevronRight />
            </Button>

            <Button
              className="hidden size-8 lg:flex"
              disabled={!table.getCanNextPage()}
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              size="icon"
              variant="outline"
            >
              <span className="sr-only">{t("pagination.goToLast")}</span>
              <TbChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
