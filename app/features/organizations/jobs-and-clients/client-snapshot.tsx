import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export const ClientSnapshot = ({
  clients,
}: {
  clients: {
    hired: number;
    name: string;
    openRoles: number;
  }[];
}) => {
  const { t } = useTranslation("organizations", {
    keyPrefix: "jobsAndClients.clientSnapshot",
  });

  return (
    <div className="bg-surface h-full squircle-rounded-3xl p-6 flex flex-col">
      <p className="font-medium text-lg mb-6">{t("title")}</p>

      <div className="flex flex-col gap-6">
        {clients.map((client) => (
          <div className="flex flex-col gap-1" key={client.name}>
            <p className="font-medium text-sm">{client.name}</p>
            <p className="text-xs text-neutral-400">
              {t("openRolesHired", {
                hired: client.hired,
                openRoles: client.openRoles,
              })}
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-auto">
        <Link className="text-sm underline" to="#">
          {t("addNewClient")}
        </Link>
      </div>
    </div>
  );
};
