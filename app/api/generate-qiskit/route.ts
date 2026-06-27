import { NextRequest, NextResponse } from "next/server";
import { generateQiskitCode, getCircuitSummary } from "@/lib/qiskit-generator";
import { CircuitSchema } from "@/lib/circuit-schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const circuitData = body?.circuit ?? body;

    const validated = CircuitSchema.safeParse(circuitData);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid circuit JSON",
          details: validated.error.errors.map(
            (e) => `${e.path.join(".")}: ${e.message}`
          ),
        },
        { status: 400 }
      );
    }

    const result = generateQiskitCode(validated.data);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      code: result.code,
      summary: getCircuitSummary(validated.data),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
