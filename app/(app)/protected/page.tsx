"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useSuiAuth } from "@/contexts/sui-auth-context";

export default function ProtectedPage() {
  // Get the current user data
  const { user } = useSuiAuth();

  return (
    <div className="container mx-auto py-10 space-y-6">
      <h1 className="text-3xl font-bold">Protected Page</h1>
      <p className="text-muted-foreground">This page is only accessible to authenticated users.</p>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>Your Account Information</CardTitle>
          </div>
          <CardDescription>Details from your Sui wallet account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">User ID</p>
              <p className="text-sm text-muted-foreground">{user?.id}</p>
            </div>
            <div>
              <p className="font-medium">Username</p>
              <p className="text-sm text-muted-foreground">{user?.username || "Not provided"}</p>
            </div>
            <div>
              <p className="font-medium">Wallet Address</p>
              <p className="text-sm text-muted-foreground font-mono">{user?.address || "Not connected"}</p>
            </div>
            <div>
              <p className="font-medium">Connection Type</p>
              <p className="text-sm text-muted-foreground">{user?.connectionType || "Unknown"}</p>
            </div>
            <div>
              <p className="font-medium">Created</p>
              <p className="text-sm text-muted-foreground">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
              </p>
            </div>
            <div>
              <p className="font-medium">Last Login</p>
              <p className="text-sm text-muted-foreground">
                {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Unknown"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
