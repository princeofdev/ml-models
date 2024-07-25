import React, {useEffect} from 'react';
import {useSelector} from 'react-redux';
import {LoadingOutlined} from '@ant-design/icons';
import {Footer} from './Footer';
import {Header} from './Header';
import {Production} from './Production';
import {BottomContainer, Container, CustomSpinner, PopupSpinnerContainer} from './popup.styles';
import {RootState} from '../redux/reducers';
import {SettingsState} from '../redux/reducers/settings';
import {ResumeOnboardingPopup} from './ResumeOnboardingPopup';
import {ChromeCommonUtils} from "../../../shared/chrome/utils/ChromeCommonUtils";

export const Popup: React.FC = () => {
    const { prodEnvironment, environment } = useSelector<RootState>((state) => state.settings) as SettingsState;
    const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(false);
    const [loading, setLoading] = React.useState<boolean>(true);
    useEffect(() => {
        checkUserCredentials();
    }, []);
    const checkUserCredentials = async () => {
        setLoading(true);
        const res = await ChromeCommonUtils.getUserCredentials().catch((e) => {});
        if (res && res?.accessCode) {
            setIsLoggedIn(true);
        } else {
            setLoading(false);
        }
    };

    const antIcon = <LoadingOutlined style={{ fontSize: 48 }} spin />;

    if (!isLoggedIn) {
        return (
            <Container isOnBoarding>
                <Header />
                {!loading ? (
                    <>
                        <ResumeOnboardingPopup isLoggedIn={isLoggedIn} />
                        <BottomContainer>
                            <p>Stay curious, stay safe.</p>
                        </BottomContainer>
                    </>
                ) : (
                    <PopupSpinnerContainer>
                        <CustomSpinner indicator={antIcon} />
                    </PopupSpinnerContainer>
                )}
            </Container>
        );
    } else {
        if (environment === 'development') {
            return (
                <Container>
                    <Header />
                    <Production />
                    <Footer />
                </Container>
            );
        }

        return (
            <Container>
                <Header />
                <Footer />
            </Container>
        );
    }
};
