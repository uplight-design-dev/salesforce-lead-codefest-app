import { Header } from "@/components/layout/header";
import { PageContent } from "@/components/layout/page-content";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { mockTeamMetrics } from "@/lib/data/mock-pipeline";

export default function TeamPage() {
  const totals = {
    followUp: Math.round(
      mockTeamMetrics.reduce((sum, m) => sum + m.followUpRate, 0) /
        mockTeamMetrics.length
    ),
    meetings: mockTeamMetrics.reduce((sum, m) => sum + m.meetingsBooked, 0),
    conversion: (
      mockTeamMetrics.reduce((sum, m) => sum + m.conversionRate, 0) /
      mockTeamMetrics.length
    ).toFixed(1),
  };

  return (
    <>
      <Header
        title="Team Performance"
        description="SDR metrics — follow-up rate, meetings booked, response time, and conversion."
      />

      <PageContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Avg Follow-up Rate"
            value={`${totals.followUp}%`}
            accent="green"
          />
          <StatCard
            label="Meetings Booked"
            value={totals.meetings}
            accent="blue"
          />
          <StatCard
            label="Avg Conversion"
            value={`${totals.conversion}%`}
            accent="navy"
          />
        </div>

        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr className="text-left text-xs text-muted">
                  <th className="px-5 py-3 font-medium">SDR</th>
                  <th className="px-5 py-3 font-medium">Follow-up Rate</th>
                  <th className="px-5 py-3 font-medium">Meetings Booked</th>
                  <th className="px-5 py-3 font-medium">Avg Response Time</th>
                  <th className="px-5 py-3 font-medium">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockTeamMetrics.map((member) => (
                  <tr key={member.id}>
                    <td className="px-5 py-4 font-medium">{member.name}</td>
                    <td className="px-5 py-4 tabular-nums">{member.followUpRate}%</td>
                    <td className="px-5 py-4 tabular-nums">{member.meetingsBooked}</td>
                    <td className="px-5 py-4 tabular-nums">
                      {member.avgResponseTimeHours}h
                    </td>
                    <td className="px-5 py-4 tabular-nums font-semibold text-uplight-green">
                      {member.conversionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </PageContent>
    </>
  );
}
