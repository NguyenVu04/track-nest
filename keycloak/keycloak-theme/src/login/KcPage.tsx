import { Suspense, lazy } from "react";
import type { ClassKey } from "keycloakify/login";
import type { KcContext } from "./KcContext";
import { useI18n } from "./i18n";
import DefaultPage from "keycloakify/login/DefaultPage";
import Template from "./Template";
import Login from "./pages/Login";
const UserProfileFormFields = lazy(
    () => import("keycloakify/login/UserProfileFormFields")
);

const doMakeUserConfirmPassword = true;

export default function KcPage(props: { kcContext: KcContext }) {
    const { kcContext } = props;

    const { i18n } = useI18n({ kcContext });

    return (
        <Suspense>
            {(() => {
                switch (kcContext.pageId) {
                    case "login.ftl":
                        return (
                            <Login
                                kcContext={kcContext}
                                i18n={i18n}
                                classes={classes}
                                Template={Template}
                                doUseDefaultCss={false}
                            />
                        );
                    default:
                        return (
                            <DefaultPage
                                kcContext={kcContext}
                                i18n={i18n}
                                classes={classes}
                                Template={Template}
                                doUseDefaultCss={false}
                                UserProfileFormFields={UserProfileFormFields}
                                doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                            />
                        );
                }
            })()}
        </Suspense>
    );
}

const classes = {
    kcHtmlClass: "tracknest-theme",
    kcBodyClass: "tracknest-body",
    kcLoginClass: "tracknest-login",
    kcHeaderClass: "tracknest-header",
    kcHeaderWrapperClass: "tracknest-header-wrapper",
    kcContentWrapperClass: "tracknest-content-wrapper",
    kcFormGroupClass: "tracknest-form-group",
    kcLabelWrapperClass: "tracknest-label-wrapper",
    kcButtonPrimaryClass: "tracknest-btn-primary",
    kcButtonClass: "tracknest-btn",
    kcInputClass: "tracknest-input",
    kcLabelClass: "tracknest-label",
    kcFormSettingClass: "tracknest-form-setting",
    kcFormOptionsWrapperClass: "tracknest-form-options-wrapper",
    kcButtonBlockClass: "tracknest-btn-block",
    kcButtonLargeClass: "tracknest-btn-large",
    kcFormSocialAccountSectionClass: "tracknest-social-section",
    kcFormSocialAccountListClass: "tracknest-social-list",
    kcFormSocialAccountListGridClass: "tracknest-social-grid",
    kcFormSocialAccountListButtonClass: "tracknest-social-button",
    kcFormSocialAccountLinkClass: "tracknest-social-link",
    kcFormCardClass: "tracknest-form-card",
    kcFormHeaderClass: "tracknest-form-header",
    kcLocaleMainClass: "tracknest-locale-main",
    kcLocaleWrapperClass: "tracknest-locale-wrapper",
    kcLocaleDropDownClass: "tracknest-locale-dropdown",
    kcLocaleListClass: "tracknest-locale-list",
    kcLocaleListItemClass: "tracknest-locale-list-item",
    kcLocaleItemClass: "tracknest-locale-item",
    kcAlertClass: "tracknest-alert",
    kcAlertTitleClass: "tracknest-alert-title",
    kcFeedbackSuccessIcon: "tracknest-feedback-success",
    kcFeedbackWarningIcon: "tracknest-feedback-warning",
    kcFeedbackErrorIcon: "tracknest-feedback-error",
    kcFeedbackInfoIcon: "tracknest-feedback-info",
    kcResetFlowIcon: "tracknest-reset-flow",
    kcSignUpClass: "tracknest-signup",
    kcInfoAreaWrapperClass: "tracknest-info-wrapper"
} satisfies { [key in ClassKey]?: string };
