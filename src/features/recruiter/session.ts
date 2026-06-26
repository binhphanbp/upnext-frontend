export type RecruiterSessionUser = Readonly<{
  id: string;
  email?: string;
  role?: string;
}>;

export type RecruiterSession = Readonly<{
  accessToken: string;
  user: RecruiterSessionUser;
}>;

export function getRecruiterSession(): RecruiterSession | null {
  const accessToken = localStorage.getItem("upnext.recruiter.accessToken");
  const rawUser = localStorage.getItem("upnext.recruiter.user");

  if (!accessToken || !rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser) as RecruiterSessionUser;

    if (!user.id) {
      clearRecruiterSession();
      return null;
    }

    return { accessToken, user };
  } catch {
    clearRecruiterSession();
    return null;
  }
}

export function clearRecruiterSession() {
  localStorage.removeItem("upnext.recruiter.accessToken");
  localStorage.removeItem("upnext.recruiter.tokenType");
  localStorage.removeItem("upnext.recruiter.user");
}
