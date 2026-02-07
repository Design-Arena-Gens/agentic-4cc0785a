'use client';

import { useMemo, useState } from "react";
import { leads } from "@/data/leads";

type SortKey = "opportunity" | "subscribers" | "recentViews";

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
});

const opportunityScore = (avgViews: number, subscribers: number) => {
  if (!subscribers) return 0;
  const engagementRate = avgViews / subscribers;
  const normalized = Math.min(engagementRate / 0.08, 1); // 8% CTR+retention considered healthy for this size
  return Math.round((1 - normalized) * 100);
};

export default function LeadDashboard() {
  const [search, setSearch] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string>("All");
  const [selectedCountry, setSelectedCountry] = useState<string>("All");
  const [sortKey, setSortKey] = useState<SortKey>("opportunity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const uniqueNiches = useMemo(
    () => Array.from(new Set(leads.map((lead) => lead.niche))).sort(),
    []
  );

  const uniqueCountries = useMemo(
    () => Array.from(new Set(leads.map((lead) => lead.country))).sort(),
    []
  );

  const scoredLeads = useMemo(() => {
    return leads.map((lead) => {
      const averageViews =
        lead.recentVideoViews.reduce((acc, val) => acc + val, 0) /
        lead.recentVideoViews.length;
      return {
        ...lead,
        averageViews,
        score: opportunityScore(averageViews, lead.subscribers),
      };
    });
  }, []);

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const data = scoredLeads.filter((lead) => {
      const matchesSearch =
        !normalizedSearch ||
        lead.channelName.toLowerCase().includes(normalizedSearch) ||
        lead.channelHandle.toLowerCase().includes(normalizedSearch);
      const matchesNiche =
        selectedNiche === "All" || lead.niche === selectedNiche;
      const matchesCountry =
        selectedCountry === "All" || lead.country === selectedCountry;

      return matchesSearch && matchesNiche && matchesCountry;
    });

    const sorted = [...data].sort((a, b) => {
      let compareValue = 0;
      if (sortKey === "opportunity") {
        compareValue = a.score - b.score;
      } else if (sortKey === "subscribers") {
        compareValue = a.subscribers - b.subscribers;
      } else {
        compareValue = a.averageViews - b.averageViews;
      }

      return sortDirection === "asc" ? compareValue : -compareValue;
    });

    return sorted;
  }, [scoredLeads, search, selectedNiche, selectedCountry, sortKey, sortDirection]);

  const aggregate = useMemo(() => {
    if (!filteredLeads.length) {
      return {
        totalSubscribers: 0,
        medianScore: 0,
        medianViews: 0,
      };
    }

    const sortedScores = filteredLeads
      .map((lead) => lead.score)
      .sort((a, b) => a - b);
    const sortedViews = filteredLeads
      .map((lead) => lead.averageViews)
      .sort((a, b) => a - b);

    const median = (values: number[]) => {
      const mid = Math.floor(values.length / 2);
      if (values.length % 2 === 0) {
        return (values[mid - 1] + values[mid]) / 2;
      }
      return values[mid];
    };

    return {
      totalSubscribers: filteredLeads.reduce(
        (acc, lead) => acc + lead.subscribers,
        0
      ),
      medianScore: Math.round(median(sortedScores)),
      medianViews: Math.round(median(sortedViews)),
    };
  }, [filteredLeads]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-400">
              Agentic Prospect Scanner
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
              Mid-Market YouTube Lead Tracker
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              Filter finance, business, and real estate creators between 10K and
              200K subscribers. Scores highlight where creative support can
              unlock watch velocity, CTR, and monetization lift.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <span className="font-medium text-white">
              {filteredLeads.length} active leads
            </span>
            <span className="h-4 w-px bg-white/20" />
            <span className="text-slate-300">
              {(aggregate.totalSubscribers / 1_000).toFixed(1)}K combined subs
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Median opportunity score
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {aggregate.medianScore}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Higher means a larger gap between subscribers and recent view
              velocity.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Median recent views
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {aggregate.medianViews.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Based on the latest uploads stored for each channel.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Combined subscribers
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {numberFormatter.format(aggregate.totalSubscribers)}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Sum of subscribers across the filtered list.
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5">
          <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-4">
              <label className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                <span className="text-slate-300">Search</span>
                <input
                  className="flex-1 bg-transparent text-white placeholder:text-slate-500 focus:outline-none"
                  placeholder="Channel or handle…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <span className="text-slate-300">Niche</span>
                <select
                  className="bg-transparent text-white focus:outline-none"
                  value={selectedNiche}
                  onChange={(event) => setSelectedNiche(event.target.value)}
                >
                  <option value="All">All</option>
                  {uniqueNiches.map((niche) => (
                    <option key={niche} value={niche}>
                      {niche}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <span className="text-slate-300">Country</span>
                <select
                  className="bg-transparent text-white focus:outline-none"
                  value={selectedCountry}
                  onChange={(event) => setSelectedCountry(event.target.value)}
                >
                  <option value="All">All</option>
                  {uniqueCountries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <span>Sort by</span>
              <div className="flex overflow-hidden rounded-lg border border-white/10">
                {[
                  { label: "Opportunity", value: "opportunity" },
                  { label: "Subscribers", value: "subscribers" },
                  { label: "Recent views", value: "recentViews" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (sortKey === option.value) {
                        setSortDirection((prev) =>
                          prev === "asc" ? "desc" : "asc"
                        );
                      } else {
                        setSortKey(option.value as SortKey);
                        setSortDirection("desc");
                      }
                    }}
                    className={`px-3 py-2 transition ${
                      sortKey === option.value
                        ? "bg-emerald-500 text-slate-900"
                        : "bg-transparent text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                    {sortKey === option.value && (
                      <span className="ml-1">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
                <tr>
                  <th className="px-6 py-3">Channel Name</th>
                  <th className="px-6 py-3">Subscribers</th>
                  <th className="px-6 py-3">Country</th>
                  <th className="px-6 py-3">Niche</th>
                  <th className="px-6 py-3">Channel Link</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Outreach Angle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredLeads.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-slate-400"
                      colSpan={7}
                    >
                      No leads match the filters. Adjust your selections to see
                      more prospects.
                    </td>
                  </tr>
                )}
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.channelHandle}
                    className="transition hover:bg-white/5"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-white">
                          {lead.channelName}
                        </span>
                        <span className="text-xs text-slate-400">
                          {lead.channelHandle} · Last upload {lead.lastUpload}
                        </span>
                        <span className="mt-1 inline-flex items-center gap-2 text-xs text-slate-300">
                          Opportunity score{" "}
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-300">
                            {lead.score}
                          </span>
                          <span className="text-slate-500">
                            Avg views {Math.round(lead.averageViews).toLocaleString()}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-200">
                      {lead.subscriberDisplay}
                    </td>
                    <td className="px-6 py-4 text-slate-200">{lead.country}</td>
                    <td className="px-6 py-4 text-slate-200">{lead.niche}</td>
                    <td className="px-6 py-4 text-slate-200">
                      <a
                        href={lead.channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
                      >
                        View channel
                      </a>
                    </td>
                    <td className="px-6 py-4 text-slate-200">
                      <a
                        href={`mailto:${lead.email}`}
                        className="font-medium text-emerald-300 underline underline-offset-2 hover:text-emerald-200"
                      >
                        {lead.email}
                      </a>
                      <p className="mt-1 text-xs text-slate-400">
                        {lead.notes}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-200">
                      <p className="leading-relaxed">{lead.outreachAngle}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
