"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img
          src="https://www.rethinkfood.org/wp-content/uploads/2021/01/rethink-food-logo.png"
          alt="Rethink Food"
          style={styles.logo}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <h1 style={styles.title}>Admin Portal</h1>
        <p style={styles.subtitle}>Sign in with your Rethink Food account</p>

        {error && (
          <p style={styles.error}>
            {error === "AccessDenied"
              ? "Access denied. Only @rethinkfood.org accounts are allowed."
              : "An error occurred. Please try again."}
          </p>
        )}

        <button
          style={styles.button}
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
        >
          <svg style={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    fontFamily: "sans-serif",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "48px 40px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    textAlign: "center",
    maxWidth: "400px",
    width: "100%",
  },
  logo: {
    height: "48px",
    marginBottom: "24px",
    objectFit: "contain",
  },
  title: {
    fontSize: "24px",
    fontWeight: 700,
    margin: "0 0 8px",
    color: "#111",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    margin: "0 0 32px",
  },
  error: {
    backgroundColor: "#fff0f0",
    border: "1px solid #ffcccc",
    borderRadius: "6px",
    color: "#c00",
    fontSize: "13px",
    padding: "10px 14px",
    marginBottom: "20px",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    padding: "12px 20px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#fff",
    fontSize: "15px",
    fontWeight: 500,
    cursor: "pointer",
    color: "#333",
    transition: "background-color 0.2s",
  },
  googleIcon: {
    width: "20px",
    height: "20px",
    flexShrink: 0,
  },
};
