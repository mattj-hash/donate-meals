import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../lib/auth";
import SignOutButton from "./SignOutButton";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <div style={styles.userInfo}>
          {session.user?.image && (
            <img
              src={session.user.image}
              alt=""
              style={styles.avatar}
            />
          )}
          <span style={styles.email}>{session.user?.email}</span>
          <SignOutButton />
        </div>
      </div>

      <div style={styles.content}>
        <p style={styles.welcome}>
          Welcome, {session.user?.name?.split(" ")[0] ?? "there"}!
        </p>
        <p style={styles.placeholder}>Admin tools coming soon.</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    fontFamily: "sans-serif",
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    borderBottom: "1px solid #e5e5e5",
    padding: "16px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: "20px",
    fontWeight: 700,
    margin: 0,
    color: "#111",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
  },
  email: {
    fontSize: "14px",
    color: "#555",
  },
  content: {
    padding: "48px 32px",
  },
  welcome: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#111",
    margin: "0 0 8px",
  },
  placeholder: {
    color: "#888",
    fontSize: "14px",
  },
};
