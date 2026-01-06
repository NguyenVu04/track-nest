import { Notification } from "@/contexts/NotificationContext";

export const mockNotifications: Notification[] = [
  {
    id: "notif-001",
    type: "crime",
    title: "Armed Robbery Reported",
    description:
      "Armed robbery reported in Downtown area, near Central Station",
    reportId: "crime-001",
    timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
    read: false,
  },
  {
    id: "notif-002",
    type: "missing-person",
    title: "Missing Person Alert",
    description: "Jane Doe, 25 years old, last seen near Central Park",
    reportId: "missing-001",
    timestamp: Date.now() - 15 * 60 * 1000, // 15 minutes ago
    read: false,
  },
  {
    id: "notif-003",
    type: "crime",
    title: "Theft in Progress",
    description: "Shoplifting incident reported at Westside Mall",
    reportId: "crime-002",
    timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
    read: true,
  },
  {
    id: "notif-004",
    type: "missing-person",
    title: "Child Missing",
    description: "Michael Chen, 8 years old, missing since yesterday evening",
    reportId: "missing-002",
    timestamp: Date.now() - 60 * 60 * 1000, // 1 hour ago
    read: false,
  },
  {
    id: "notif-005",
    type: "crime",
    title: "Hit and Run Accident",
    description:
      "Vehicle collision reported on Highway 101, hit and run suspect",
    reportId: "crime-003",
    timestamp: Date.now() - 120 * 60 * 1000, // 2 hours ago
    read: true,
  },
  {
    id: "notif-006",
    type: "missing-person",
    title: "Elderly Person Missing",
    description: "Robert Johnson, 72 years old, suffering from Alzheimer's",
    reportId: "missing-003",
    timestamp: Date.now() - 180 * 60 * 1000, // 3 hours ago
    read: true,
  },
  {
    id: "notif-007",
    type: "crime",
    title: "Burglary in Residential Area",
    description: "Home burglary reported in Sunset Valley neighborhood",
    reportId: "crime-004",
    timestamp: Date.now() - 240 * 60 * 1000, // 4 hours ago
    read: true,
  },
  {
    id: "notif-008",
    type: "missing-person",
    title: "Missing Teenager",
    description: "Sarah Williams, 17 years old, missing from school",
    reportId: "missing-004",
    timestamp: Date.now() - 300 * 60 * 1000, // 5 hours ago
    read: false,
  },
];
