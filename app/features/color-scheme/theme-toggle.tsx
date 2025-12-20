import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { TbBrightness } from "react-icons/tb";
import { Form } from "react-router";
import { useHydrated } from "remix-utils/use-hydrated";

import {
  COLOR_SCHEME_FORM_KEY,
  colorSchemes,
  THEME_TOGGLE_INTENT,
} from "./color-scheme-constants";
import { useColorScheme } from "./use-color-scheme";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";

function ColorSchemeButton({
  className,
  value,
  ...props
}: ComponentProps<"button">) {
  const currentColorScheme = useColorScheme();
  const isActive = currentColorScheme === value;

  return (
    <DropdownMenuItem
      className={cn("w-full", isActive && "text-primary [&_svg]:text-primary!")}
      disabled={isActive}
      render={
        <button
          {...props}
          className={className}
          name={COLOR_SCHEME_FORM_KEY}
          type="submit"
          value={value}
        />
      }
    />
  );
}

export function ThemeToggle() {
  const { t } = useTranslation("colorScheme");
  const hydrated = useHydrated();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label={t("dropdownMenuButtonLabel")}
            className="size-8"
            // Playwright shouldn't try to click the button before it's hydrated
            disabled={!hydrated}
            size="icon"
            variant="outline"
          />
        }
      >
        <TbBrightness />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={4}>
        <DropdownMenuGroup
          render={
            <Form action="/color-scheme" method="post" navigate={false} />
          }
        >
          <DropdownMenuLabel className="sr-only">
            {t("dropdownMenuLabel")}
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="sr-only" />

          <input name="intent" type="hidden" value={THEME_TOGGLE_INTENT} />

          <ColorSchemeButton value={colorSchemes.light}>
            <IconSun />
            {t("dropdownMenuItemLight")}
          </ColorSchemeButton>

          <ColorSchemeButton value={colorSchemes.dark}>
            <IconMoon />
            {t("dropdownMenuItemDark")}
          </ColorSchemeButton>

          <ColorSchemeButton value={colorSchemes.system}>
            <IconDeviceDesktop />
            {t("dropdownMenuItemSystem")}
          </ColorSchemeButton>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
