"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { clearAllAppStorage } from "@/lib/app-storage";
import { withBasePath } from "@/lib/routes";

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  title: string;
  description?: string;
  resetHref?: string;
}

interface FeatureErrorBoundaryState {
  error: Error | null;
}

export class FeatureErrorBoundary extends Component<
  FeatureErrorBoundaryProps,
  FeatureErrorBoundaryState
> {
  state: FeatureErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): FeatureErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.title}]`, error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  private handleClearData = () => {
    clearAllAppStorage();
    this.setState({ error: null });
    window.location.assign(withBasePath(this.props.resetHref ?? "/"));
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 p-6 text-center">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {this.props.title}
          </h2>
          <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
            {this.props.description ??
              "This panel hit an unexpected error. You can retry or reset saved browser data."}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={this.handleRetry}>
              Try again
            </Button>
            {this.props.resetHref && (
              <Button asChild size="sm" variant="outline">
                <Link href={this.props.resetHref}>Go back</Link>
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={this.handleClearData}>
              Clear saved data
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
