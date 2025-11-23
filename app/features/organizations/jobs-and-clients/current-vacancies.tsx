import { MapPin, UsersRound } from "lucide-react";
import { Link } from "react-router";

const vacancies = [
  {
    hired: 0,
    id: 1,
    location: "United states",
    title: "Product Designer",
    total: 5,
  },
  {
    hired: 0,
    id: 2,
    location: "United states",
    title: "Product Designer",
    total: 5,
  },
  {
    hired: 2,
    id: 3,
    location: "Canada",
    title: "UX Researcher",
    total: 3,
  },
  {
    hired: 2,
    id: 3,
    location: "Canada",
    title: "UX Researcher",
    total: 3,
  },
];

export const CurrentVacancies = () => {
  return (
    <div className="bg-surface h-full squircle-rounded-3xl p-0 flex flex-col">
      <div className="px-6 pt-6 pb-2">
        <p className="font-medium text-lg">Current Vacancies</p>
      </div>

      <div className="flex flex-col gap-2 flex-1 px-4 pt-2">
        {vacancies.map((vacancy) => (
          <div
            className="flex items-center gap-2 p-2.5 squircle-rounded-2xl border border-border/50"
            key={vacancy.id}
          >
            <div className="size-8 rounded-full overflow-hidden shrink-0">
              <img
                alt="vacancy"
                className="w-full h-full object-cover"
                src="/images/client-dp.png"
              />
            </div>

            <div className="flex flex-col gap-1 w-full">
              <p className="text-xs font-medium">{vacancy.title}</p>

              <div className="flex items-center gap-1 text-[10px] text-black dark:text-white w-full">
                <div className="flex items-center gap-1 flex-1 overflow-hidden shrink-0">
                  <MapPin size={12} />
                  <span className=" whitespace-nowrap truncate">
                    {vacancy.location}
                  </span>
                </div>

                <div className="flex items-center gap-1 flex-1 overflow-hidden shrink-0">
                  <UsersRound size={12} />
                  <span className=" whitespace-nowrap truncate">
                    {vacancy.hired}/{vacancy.total} hired
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center pb-5">
        <Link className="text-sm underline" to="#">
          See more
        </Link>
      </div>
    </div>
  );
};
