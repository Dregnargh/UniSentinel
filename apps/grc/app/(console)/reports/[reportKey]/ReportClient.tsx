"use client";

import Link from "next/link";
import { Badge, Button, Card, Select } from "@unisentinel/ui";

interface ReportParams {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}

export function ReportClient({
  report,
}: {
  report: {
    key: string;
    title: string;
    description: string;
    moduleName: string;
    params: ReportParams[];
  };
}) {
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>{report.title}</h1>
          <p>
            <Link href="/reports">← All reports</Link> · <Badge tone="brand">{report.moduleName}</Badge>
          </p>
        </div>
      </div>
      <Card>
        <Card.Header>
          <Card.Title subtitle={report.description}>Parameters</Card.Title>
        </Card.Header>
        {/* A plain GET form: the browser downloads the PDF attachment and the
            page stays put. Params are re-validated server-side. */}
        <form action={`/api/reports/${report.key}`} method="get">
          <Card.Body>
            <div className="form-grid" style={{ maxWidth: 460 }}>
              {report.params.map((p) => (
                <div key={p.name}>
                  <label htmlFor={`param-${p.name}`}>{p.label}</label>
                  <Select id={`param-${p.name}`} name={p.name} defaultValue={p.options[0]?.value}>
                    {p.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </Card.Body>
          <Card.Footer>
            <Button type="submit">Download PDF</Button>
          </Card.Footer>
        </form>
      </Card>
    </div>
  );
}
