import { useState } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import tracknestLogo from "../assets/tracknest-logo.png";

export default function Login(props: PageProps<Extract<KcContext, { pageId: "login.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { social, realm, url, login, auth, message, isAppInitiatedAction } = kcContext;

    const { msg, msgStr } = i18n;

    const [isLoginButtonDisabled] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const label = !realm.loginWithEmailAllowed ? "username" : realm.registrationEmailAsUsername ? "email" : "usernameOrEmail";

    const autoCompleteHelper: typeof label = label === "usernameOrEmail" ? "username" : label;
    const inputPlaceholder = label === "email" ? "your@email.com" : label === "username" ? "Username" : "Username or email";

    return (
        <Template {...{ kcContext, i18n, doUseDefaultCss, classes }} displayMessage={false} headerNode={null} displayInfo={false} infoNode={null}>
            <div className="tn-login-card">
                {/* Logo */}
                <div className="tn-logo-wrap">
                    <img src={tracknestLogo} alt="TrackNest" className="tn-logo-img" />
                </div>

                {/* Heading */}
                <h1 className="tn-title">Welcome back</h1>
                <p className="tn-subtitle">Please enter your details to sign in.</p>

                {/* Alert messages */}
                {message !== undefined && (message.type !== "warning" || !isAppInitiatedAction) && (
                    <div className={`tn-alert tn-alert-${message.type}`}>{message.summary}</div>
                )}

                {/* Social providers (above form, like reference image 2) */}
                {realm.password && social?.providers !== undefined && social.providers.length > 0 && (
                    <>
                        <div className="tn-social-row">
                            {social.providers.map(p => (
                                <a key={p.providerId} href={p.loginUrl} id={`zocial-${p.alias}`} className="tn-social-btn" title={p.displayName}>
                                    <span className="tn-social-label">{p.displayName}</span>
                                </a>
                            ))}
                        </div>
                        <div className="tn-divider">
                            <span>or</span>
                        </div>
                    </>
                )}

                {/* Login form */}
                <form id="kc-form-login" action={url.loginAction} method="post" className="tn-form">
                    {/* Username / Email field */}
                    <div className="tn-field">
                        <label htmlFor="username" className="tn-label">
                            {label === "email" ? "Email" : label === "username" ? "Username" : "Email or Username"}
                        </label>
                        <div className="tn-input-wrap">
                            <span className="tn-input-icon">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            <input
                                tabIndex={1}
                                id="username"
                                className="tn-input"
                                name="username"
                                defaultValue={login.username ?? ""}
                                type="text"
                                autoFocus={true}
                                autoComplete={autoCompleteHelper}
                                placeholder={inputPlaceholder}
                            />
                        </div>
                    </div>

                    {/* Password field */}
                    <div className="tn-field">
                        <label htmlFor="password" className="tn-label">
                            Password
                        </label>
                        <div className="tn-input-wrap">
                            <span className="tn-input-icon">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </span>
                            <input
                                tabIndex={2}
                                id="password"
                                className="tn-input"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                className="tn-password-toggle"
                                onClick={() => setShowPassword(v => !v)}
                                tabIndex={-1}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? (
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Remember me + Forgot password row */}
                    <div className="tn-form-meta">
                        {realm.rememberMe && (
                            <label className="tn-remember">
                                <input
                                    tabIndex={3}
                                    id="rememberMe"
                                    name="rememberMe"
                                    type="checkbox"
                                    {...(login.rememberMe === "on" ? { defaultChecked: true } : {})}
                                />
                                <span>{msgStr("rememberMe")}</span>
                            </label>
                        )}
                        {!realm.rememberMe && <span />}
                        {realm.resetPasswordAllowed && (
                            <a tabIndex={5} href={url.loginResetCredentialsUrl} className="tn-forgot">
                                Forgot password?
                            </a>
                        )}
                    </div>

                    {/* Hidden credential input */}
                    <input
                        type="hidden"
                        id="id-hidden-input"
                        name="credentialId"
                        {...(auth?.selectedCredential !== undefined ? { value: auth.selectedCredential } : {})}
                    />

                    {/* Submit button */}
                    <button tabIndex={4} className="tn-submit-btn" name="login" id="kc-login" type="submit" disabled={isLoginButtonDisabled}>
                        {msgStr("doLogIn")}
                    </button>
                </form>

                {/* Register link */}
                {realm.password && (
                    <div className="tn-register">
                        <span>{msgStr("noAccount")} </span>
                        <a tabIndex={6} href={url.registrationUrl}>
                            {msgStr("doRegister")}
                        </a>
                    </div>
                )}

                {/* Try another way */}
                {auth !== undefined && auth.showTryAnotherWayLink && (
                    <form
                        id="kc-select-try-another-way-form"
                        action={url.loginAction}
                        method="post"
                        style={{ textAlign: "center", marginTop: "12px" }}
                    >
                        <input type="hidden" name="tryAnotherWay" value="on" />
                        <a
                            href="#"
                            id="try-another-way"
                            onClick={event => {
                                document.forms["kc-select-try-another-way-form" as never].requestSubmit();
                                event.preventDefault();
                                return false;
                            }}
                        >
                            {msg("doTryAnotherWay")}
                        </a>
                    </form>
                )}
            </div>
        </Template>
    );
}
