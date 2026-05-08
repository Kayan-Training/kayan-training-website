"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { EventsTable, type EventRow } from "../events/events-table";

type ProgramTab = "events" | "training";

export function ProgramsTabs({
  activeLocale,
  rows,
}: {
  activeLocale: "ar" | "en";
  rows: EventRow[];
}) {
  const [allRows, setAllRows] = useState(rows);
  const [activeTab, setActiveTab] = useState<ProgramTab>("events");

  const eventRows = useMemo(
    () => allRows.filter((row) => row.eventKind === "event"),
    [allRows],
  );
  const trainingRows = useMemo(
    () => allRows.filter((row) => row.eventKind === "training_course"),
    [allRows],
  );

  const scopedRows = activeTab === "events" ? eventRows : trainingRows;

  function handleDeleted(ids: string[]) {
    setAllRows((prev) => prev.filter((row) => !ids.includes(row.id)));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-card p-3">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProgramTab)}>
          <TabsList className="w-full justify-start gap-2 p-1" variant="default">
            <TabsTrigger
              className={cn(
                "h-9 flex-none px-3 text-sm",
                activeTab === "events" && "border border-primary/30 bg-primary/10 text-primary",
              )}
              value="events"
              onClick={() => setActiveTab("events")}
            >
              {activeLocale === "ar" ? "الفعاليات" : "Events"}
              <Badge className="ml-1 h-5 rounded-full border-primary/30 bg-primary/10 px-1.5 text-[10px] text-primary" variant="outline">
                {eventRows.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              className={cn(
                "h-9 flex-none px-3 text-sm",
                activeTab === "training" && "border border-primary/30 bg-primary/10 text-primary",
              )}
              value="training"
              onClick={() => setActiveTab("training")}
            >
              {activeLocale === "ar" ? "الدورات التدريبية" : "Training Courses"}
              <Badge className="ml-1 h-5 rounded-full border-primary/30 bg-primary/10 px-1.5 text-[10px] text-primary" variant="outline">
                {trainingRows.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <EventsTable
        activeLocale={activeLocale}
        emptyDescription={
          activeTab === "events"
            ? activeLocale === "ar"
              ? "لا توجد فعاليات مطابقة للبحث أو الفلاتر."
              : "No events match your search/filter criteria."
            : activeLocale === "ar"
              ? "لا توجد دورات تدريبية مطابقة للبحث أو الفلاتر."
              : "No training courses match your search/filter criteria."
        }
        emptyTitle={
          activeTab === "events"
            ? activeLocale === "ar"
              ? "لا توجد فعاليات"
              : "No events found"
            : activeLocale === "ar"
              ? "لا توجد دورات تدريبية"
              : "No training courses found"
        }
        events={scopedRows}
        onDeleted={handleDeleted}
        programKindLabel={activeTab === "events" ? "Events" : "Training courses"}
      />
    </div>
  );
}
