import { Link } from "react-router";

const clients = [
  {
    hired: 20,
    name: "Google",
    openRoles: 4,
  },
  {
    hired: 15,
    name: "Microsoft",
    openRoles: 3,
  },
  {
    hired: 30,
    name: "Amazon",
    openRoles: 5,
  },
  {
    hired: 10,
    name: "Apple",
    openRoles: 2,
  },
];

export const ClientSnapshot = () => {
  return (
    <div className="bg-surface h-full squircle-rounded-3xl p-6 flex flex-col">
      <p className="font-medium text-lg mb-6">Client Snapshot</p>

      <div className="flex flex-col gap-6">
        {clients.map((client) => (
          <div className="flex flex-col gap-1" key={client.name}>
            <p className="font-medium text-sm">{client.name}</p>
            <p className="text-xs text-neutral-400">
              {client.openRoles} open roles, {client.hired} hired
            </p>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-auto">
        <Link className="text-sm underline" to="#">
          Add new client
        </Link>
      </div>
    </div>
  );
};
