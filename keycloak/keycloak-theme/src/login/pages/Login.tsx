import { useState } from "react";
import { clsx } from "keycloakify/tools/clsx";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";

export default function Login(props: PageProps<Extract<KcContext, { pageId: "login.ftl" }>, I18n>) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes
    });

    const { social, realm, url, login, auth } = kcContext;

    const { msg, msgStr } = i18n;

    const [isLoginButtonDisabled] = useState(false);

    return (
        <Template
            {...{ kcContext, i18n, doUseDefaultCss, classes }}
            displayMessage={!realm.loginWithEmailAllowed}
            headerNode={msg("doLogIn")}
            displayInfo={social?.displayInfo}
            infoNode={
                <div id="kc-registration-container">
                    <div id="kc-registration">
                        <span>
                            {msg("noAccount")}
                            {" "}
                            <a tabIndex={6} href={url.registrationUrl}>
                                {msg("doRegister")}
                            </a>
                        </span>
                    </div>
                </div>
            }
        >
            <div id="kc-form">
                <div id="kc-form-wrapper">
                    <form id="kc-form-login" action={url.loginAction} method="post">
                        <div className={kcClsx("kcFormGroupClass")}>
                            {(() => {
                                const label = !realm.loginWithEmailAllowed
                                    ? "username"
                                    : realm.registrationEmailAsUsername
                                    ? "email"
                                    : "usernameOrEmail";

                                const autoCompleteHelper: typeof label = label === "usernameOrEmail" ? "username" : label;

                                return (
                                    <>
                                        <label htmlFor="username" className={kcClsx("kcLabelClass")}>
                                            {msg(label)}
                                        </label>
                                        <input
                                            tabIndex={1}
                                            id="username"
                                            className={clsx(kcClsx("kcInputClass"), "pf-c-form-control")}
                                            name="username"
                                            defaultValue={login.username ?? ""}
                                            type="text"
                                            autoFocus={true}
                                            autoComplete={autoCompleteHelper}
                                        />
                                    </>
                                );
                            })()}
                        </div>
                        <div className={kcClsx("kcFormGroupClass")}>
                            <label htmlFor="password" className={kcClsx("kcLabelClass")}>
                                {msg("password")}
                            </label>
                            <input
                                tabIndex={2}
                                id="password"
                                className={clsx(kcClsx("kcInputClass"), "pf-c-form-control")}
                                name="password"
                                type="password"
                                autoComplete="current-password"
                            />
                        </div>
                        <div className={clsx(kcClsx("kcFormGroupClass"), kcClsx("kcFormSettingClass"))}>
                            <div id="kc-form-options">
                                {realm.rememberMe && (
                                    <div className="checkbox">
                                        <label>
                                            <input
                                                tabIndex={3}
                                                id="rememberMe"
                                                name="rememberMe"
                                                type="checkbox"
                                                {...(login.rememberMe === "on"
                                                    ? {
                                                          checked: true
                                                      }
                                                    : {})}
                                            />
                                            {msg("rememberMe")}
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div className={kcClsx("kcFormOptionsWrapperClass")}>
                                {realm.resetPasswordAllowed && (
                                    <span>
                                        <a tabIndex={5} href={url.loginResetCredentialsUrl}>
                                            {msg("doForgotPassword")}
                                        </a>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div id="kc-form-buttons" className={kcClsx("kcFormGroupClass")}>
                            <input
                                type="hidden"
                                id="id-hidden-input"
                                name="credentialId"
                                {...(auth?.selectedCredential !== undefined
                                    ? {
                                          value: auth.selectedCredential
                                      }
                                    : {})}
                            />
                            <input
                                tabIndex={4}
                                className={clsx(
                                    kcClsx("kcButtonClass"),
                                    kcClsx("kcButtonPrimaryClass"),
                                    kcClsx("kcButtonBlockClass"),
                                    kcClsx("kcButtonLargeClass"),
                                    "pf-c-button",
                                    "pf-m-primary"
                                )}
                                name="login"
                                id="kc-login"
                                type="submit"
                                value={msgStr("doLogIn")}
                                disabled={isLoginButtonDisabled}
                            />
                        </div>
                    </form>
                </div>
            </div>
            {realm.password && social?.providers !== undefined && (
                <div id="kc-social-providers" className={clsx(kcClsx("kcFormSocialAccountSectionClass"))}>
                    <ul
                        className={clsx(
                            kcClsx("kcFormSocialAccountListClass"),
                            social.providers.length > 4 && kcClsx("kcFormSocialAccountListGridClass")
                        )}
                    >
                        {social.providers.map(p => (
                            <li key={p.providerId}>
                                <a href={p.loginUrl} id={`zocial-${p.alias}`} className={clsx("zocial", kcClsx("kcFormSocialAccountLinkClass"))}>
                                    <span>{p.displayName}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Template>
    );
}