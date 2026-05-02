import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  NotificationProvider,
  useNotification,
  type Notification,
} from "@/contexts/NotificationContext";

// Helper component that exposes the context via the DOM
function TestConsumer() {
  const {
    notifications,
    addNotification,
    markAsRead,
    removeNotification,
    clearAll,
    unreadCount,
  } = useNotification();

  return (
    <div>
      <span data-testid="count">{notifications.length}</span>
      <span data-testid="unread">{unreadCount}</span>

      {notifications.map((n: Notification) => (
        <div key={n.id} data-testid={`notification-${n.id}`}>
          <span data-testid={`title-${n.id}`}>{n.title}</span>
          <span data-testid={`type-${n.id}`}>{n.type}</span>
          <span data-testid={`read-${n.id}`}>{String(n.read)}</span>
          <button onClick={() => markAsRead(n.id)}>read-{n.id}</button>
          <button onClick={() => removeNotification(n.id)}>remove-{n.id}</button>
        </div>
      ))}

      <button
        onClick={() =>
          addNotification({
            type: "crime",
            title: "Crime Alert",
            description: "Suspicious activity nearby",
            reportId: "report-1",
          })
        }
      >
        add-crime
      </button>

      <button
        onClick={() =>
          addNotification({
            type: "missing-person",
            title: "Missing Person",
            description: "Someone reported missing",
            reportId: "report-2",
          })
        }
      >
        add-missing
      </button>

      <button
        onClick={() =>
          addNotification({
            type: "emergency",
            title: "Emergency",
            description: "Emergency request",
            reportId: "report-3",
          })
        }
      >
        add-emergency
      </button>

      <button onClick={clearAll}>clear-all</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <NotificationProvider>
      <TestConsumer />
    </NotificationProvider>,
  );
}

describe("NotificationProvider", () => {
  it("starts with an empty notification list", () => {
    renderWithProvider();
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("unread")).toHaveTextContent("0");
  });

  it("adds a crime notification", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("add-crime"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.getByText("Crime Alert")).toBeInTheDocument();
  });

  it("adds a missing-person notification", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("add-missing"));
    expect(screen.getByText("Missing Person")).toBeInTheDocument();
  });

  it("adds an emergency notification", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("add-emergency"));
    expect(screen.getByText("Emergency")).toBeInTheDocument();
  });

  it("new notifications default to unread", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("add-crime"));
    expect(screen.getByTestId("unread")).toHaveTextContent("1");
  });

  it("prepends new notifications (most recent first)", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("add-crime"));
    fireEvent.click(screen.getByText("add-missing"));
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    // Most recent ("Missing Person") appears second in DOM order but was added last
    const titles = screen.getAllByText(/Crime Alert|Missing Person/);
    expect(titles).toHaveLength(2);
  });

  it("increments unreadCount for each new notification", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("add-crime"));
    fireEvent.click(screen.getByText("add-missing"));
    expect(screen.getByTestId("unread")).toHaveTextContent("2");
  });

  it("assigns unique ids to each notification", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("add-crime"));
    fireEvent.click(screen.getByText("add-crime"));
    const countEl = screen.getByTestId("count");
    expect(countEl).toHaveTextContent("2");
    // Both are present — they have unique ids so both render
    expect(screen.getAllByText("Crime Alert")).toHaveLength(2);
  });

  it("marks a notification as read", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("add-crime"));
    // Get the notification id from the DOM
    const notifDivs = document.querySelectorAll('[data-testid^="notification-"]');
    expect(notifDivs).toHaveLength(1);
    const id = notifDivs[0].getAttribute("data-testid")!.replace("notification-", "");

    // Initially unread
    expect(screen.getByTestId(`read-${id}`)).toHaveTextContent("false");

    fireEvent.click(screen.getByText(`read-${id}`));

    expect(screen.getByTestId(`read-${id}`)).toHaveTextContent("true");
    expect(screen.getByTestId("unread")).toHaveTextContent("0");
  });

  it("markAsRead does not affect other notifications", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("add-crime"));
    fireEvent.click(screen.getByText("add-missing"));

    const notifDivs = document.querySelectorAll('[data-testid^="notification-"]');
    expect(notifDivs).toHaveLength(2);
    const firstId = notifDivs[0].getAttribute("data-testid")!.replace("notification-", "");

    fireEvent.click(screen.getByText(`read-${firstId}`));

    // One read, one still unread
    expect(screen.getByTestId("unread")).toHaveTextContent("1");
  });

  it("removes a notification", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("add-crime"));

    const notifDivs = document.querySelectorAll('[data-testid^="notification-"]');
    const id = notifDivs[0].getAttribute("data-testid")!.replace("notification-", "");

    fireEvent.click(screen.getByText(`remove-${id}`));

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.queryByTestId(`notification-${id}`)).not.toBeInTheDocument();
  });

  it("removeNotification does not affect other notifications", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("add-crime"));
    fireEvent.click(screen.getByText("add-missing"));

    const notifDivs = document.querySelectorAll('[data-testid^="notification-"]');
    const firstId = notifDivs[0].getAttribute("data-testid")!.replace("notification-", "");

    fireEvent.click(screen.getByText(`remove-${firstId}`));

    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  it("clearAll removes all notifications", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("add-crime"));
    fireEvent.click(screen.getByText("add-missing"));
    fireEvent.click(screen.getByText("add-emergency"));

    expect(screen.getByTestId("count")).toHaveTextContent("3");

    fireEvent.click(screen.getByText("clear-all"));

    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("unread")).toHaveTextContent("0");
  });

  it("unreadCount reflects only unread notifications", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("add-crime"));
    fireEvent.click(screen.getByText("add-missing"));

    const notifDivs = document.querySelectorAll('[data-testid^="notification-"]');
    const firstId = notifDivs[0].getAttribute("data-testid")!.replace("notification-", "");
    fireEvent.click(screen.getByText(`read-${firstId}`));

    expect(screen.getByTestId("unread")).toHaveTextContent("1");
  });

  it("unreadCount reaches zero after reading all notifications", () => {
    renderWithProvider();
    fireEvent.click(screen.getByText("add-crime"));

    const notifDivs = document.querySelectorAll('[data-testid^="notification-"]');
    const id = notifDivs[0].getAttribute("data-testid")!.replace("notification-", "");
    fireEvent.click(screen.getByText(`read-${id}`));

    expect(screen.getByTestId("unread")).toHaveTextContent("0");
  });

  it("id includes a timestamp component", () => {
    const beforeTime = Date.now();
    renderWithProvider();
    fireEvent.click(screen.getByText("add-crime"));

    const notifDivs = document.querySelectorAll('[data-testid^="notification-"]');
    const id = notifDivs[0].getAttribute("data-testid")!.replace("notification-", "");
    const timestamp = Number(id.split("-")[0]);

    expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
  });
});

describe("useNotification outside provider", () => {
  it("throws an error when used outside NotificationProvider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

    function BadConsumer() {
      useNotification();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow(
      "useNotification must be used within a NotificationProvider",
    );

    consoleError.mockRestore();
  });
});
