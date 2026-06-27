import { NextRequest, NextResponse } from "next/server";
import { parseQiskitCode } from "@/lib/qiskit-parser";
import { CircuitSchema } from "@/lib/circuit-schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = body?.code;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Request body must include a 'code' string field" },
        { status: 400 }
      );
    }

    if (code.length > 100_000) {
      return NextResponse.json(
        { success: false, error: "Code exceeds maximum length of 100,000 characters" },
        { status: 400 }
      );
    }

    const name = typeof body.name === "string" ? body.name : "Imported Circuit";
    const result = parseQiskitCode(code, name);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 422 }
      );
    }

    const validated = CircuitSchema.safeParse(result.circuit);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Parsed circuit failed schema validation",
          details: validated.error.errors.map((e) => e.message),
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, circuit: validated.data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
