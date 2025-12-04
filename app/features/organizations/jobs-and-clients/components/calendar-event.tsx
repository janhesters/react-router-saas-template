import { format } from "date-fns";
import {
  Clock,
  FileText,
  MapPin,
  MoreHorizontal,
  Plus,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import type { EventProps } from "react-big-calendar";
import { useTranslation } from "react-i18next";

import type { CalendarEvent } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

export const CalendarEventComponent = ({
  event,
}: EventProps<CalendarEvent>) => {
  const { t } = useTranslation("organizations", {
    keyPrefix: "jobsAndClients.calendar",
  });

  const getEventStyle = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "interview":
        return "bg-blue-500/10 border-blue-500/20 text-blue-500";
      case "sync":
        return "bg-purple-500/10 border-purple-500/20 text-purple-500";
      case "review":
        return "bg-orange-500/10 border-orange-500/20 text-orange-500";
      default:
        return "bg-gray-500/10 border-gray-500/20 text-gray-500";
    }
  };

  const getIcon = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "interview":
        return <Video className="size-3" />;
      case "sync":
        return <Users className="size-3" />;
      case "review":
        return <FileText className="size-3" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "size-full p-1 flex flex-col gap-1 rounded-2xl px-3 py-2 cursor-pointer transition-colors hover:brightness-110",
            getEventStyle(event.type),
          )}
        >
          <div className="flex items-center gap-1.5 font-semibold text-xs">
            {getIcon(event.type)}
            <span className="truncate">{event.title}</span>
          </div>
          <div className="flex items-center gap-1 mt-auto">
            {event.attendees?.map((avatar: string) => (
              <img
                alt={t("attendeeAlt")}
                className="size-4 rounded-full border border-background ring-1 ring-background"
                key={avatar}
                src={avatar}
              />
            ))}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-80 p-0 overflow-hidden rounded-3xl"
      >
        <div className={cn("p-4", getEventStyle(event.type).split(" ")[0])}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              {getIcon(event.type)}
              <span className="text-sm">{t(`eventTypes.${event.type}`)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button className="h-6 w-6" size="icon" variant="ghost">
                <MoreHorizontal className="size-4" />
              </Button>
              <Button
                className="h-6 w-6 text-destructive hover:text-destructive"
                size="icon"
                variant="ghost"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          <h4 className="font-bold text-lg mt-2 leading-tight text-foreground">
            {event.title}
          </h4>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <Clock className="size-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">
                  {format(event.start, "EEEE, MMMM d")}
                </p>
                <p className="text-muted-foreground">
                  {format(event.start, "h:mm a")} -{" "}
                  {format(event.end, "h:mm a")}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="size-4 text-muted-foreground mt-0.5" />
                <p>{event.location}</p>
              </div>
            )}

            {event.description && (
              <div className="flex items-start gap-3 text-sm">
                <FileText className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-muted-foreground leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("attendeesLabel")}
            </p>
            <div className="flex items-center gap-2">
              {event.attendees?.map((avatar: string, i: number) => (
                <Avatar
                  className="size-8 border-2 border-background"
                  key={avatar}
                >
                  <AvatarImage src={avatar} />
                  <AvatarFallback>U{i + 1}</AvatarFallback>
                </Avatar>
              ))}
              <Button
                className="size-8 rounded-full ml-1"
                size="icon"
                variant="outline"
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {event.meetingLink && (
          <div className="p-4 bg-muted/50 flex justify-end">
            <Button
              className="gap-2 rounded-2xl!"
              onClick={() => window.open(event.meetingLink, "_blank")}
              size="sm"
            >
              <Video className="size-4" />
              {t("joinMeeting")}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
