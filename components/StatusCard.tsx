"use client";

type StatusCardProps = {
  status: "loading" | "error" | "not-raining" | null;
  message?: string;
  localWeatherSummary?: string;
};

export default function StatusCard({ status, message, localWeatherSummary }: StatusCardProps) {
  if (!status) return null;

  if (status === "loading") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-blue-800">{message || "Checking weather and finding dry places..."}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-medium">Error</p>
        <p className="text-red-600 mt-1">{message || "Something went wrong. Please try again."}</p>
      </div>
    );
  }

  if (status === "not-raining") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-3">☀️</div>
        <p className="text-green-800 font-medium text-lg mb-2">Good news!</p>
        <p className="text-green-700">
          {localWeatherSummary || "It's not raining at your location for the next 12 hours – enjoy it!"}
        </p>
      </div>
    );
  }

  return null;
}

