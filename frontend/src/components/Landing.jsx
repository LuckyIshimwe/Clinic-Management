import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2000/api";

export default function Landing() {
  const navigate = useNavigate();
  const [role, setRole] = useState("nurse");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [staffId, setStaffId] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [specialization, setSpecialization] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${baseURL}/user/register`, {
        name,
        email,
        password,
        role,
        staffId,
        clinicId,
        specialization,
      });

      alert(res.data.message || "Account created!");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-50 p-6">
      <Card className="w-full max-w-lg shadow-md border">
        <CardHeader className="text-center">
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Choose your role to continue</CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="nurse" onValueChange={setRole} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="nurse">Nurse</TabsTrigger>
              <TabsTrigger value="doctor">Doctor</TabsTrigger>
            </TabsList>

            {/* -------- FORM -------- */}
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="john@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Extra fields for doctor */}
              {role === "doctor" && (
                <>
                  <div className="space-y-2">
                    <Label>Staff ID</Label>
                    <Input
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      placeholder="STF-0013"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Clinic ID</Label>
                    <Input
                      value={clinicId}
                      onChange={(e) => setClinicId(e.target.value)}
                      placeholder="CLN-04"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Specialization</Label>
                    <Input
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="Cardiology, Pediatrics…"
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full">
                Create {role === "nurse" ? "Nurse" : "Doctor"} Account
              </Button>

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="text-primary px-1"
                  onClick={() => navigate("/")}
                >
                  Sign in
                </Button>
              </p>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
