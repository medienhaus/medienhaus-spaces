import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from 'styled-components';

import Form from '../../../components/UI/Form';
import LoadingSpinnerInline from '../../../components/UI/LoadingSpinnerInline';
import logger from '../../../lib/Logging';
import { Switch } from '@/components/UI/switch.jsx';
import ErrorMessage from '@/components/UI/ErrorMessage';

const SwitchContainer = styled.div`
  display: flex;
  gap: var(--margin);
  align-items: center;
  justify-content: space-between;
`;

export default function CreateNewPad({ createPadAndOpen, isMyPadsApiEnabled, callbackDone }) {
    const { t } = useTranslation('etherpad');

    const [padName, setPadName] = useState('');
    const [passwordProtected, setPasswordProtected] = useState(false);
    const [password, setPassword] = useState('');
    const [validatePassword, setValidatePassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const createPad = async () => {
        setIsLoading(true);
        setErrorMessage('');
        const createPad = await createPadAndOpen(padName, passwordProtected ? 'private' : 'public', password)
            .catch(error => {
                logger.debug(error);
                setErrorMessage('Something went wrong, please try again.');
            });
        setIsLoading(false);
        if (!createPad) return;
        callbackDone && callbackDone();
        setPadName('');
    };

    return (<Form onSubmit={(e) => { e.preventDefault(); createPad(); }}>
        <h3>{ t('Create new pad') }</h3>
        <input type="text" placeholder={t('Name')} value={padName} onChange={(e) => setPadName(e.target.value)} />
        { isMyPadsApiEnabled &&
      <SwitchContainer>
          <label htmlFor="passwordProtected">{ t('Password protected') }</label>
          <Switch
              id="passwordProtected"
              checked={passwordProtected}
              onCheckedChange={() => setPasswordProtected(prevState => !prevState)}
          />
      </SwitchContainer>
        }
        <input type="password" disabled={!passwordProtected} placeholder={t('Password')} value={password} onChange={(e) => setPassword(e.target.value)} />
        <input type="password" disabled={!passwordProtected} placeholder={t('Confirm password')} value={validatePassword} onChange={(e) => setValidatePassword(e.target.value)} />
        <button type="submit" disabled={!padName || (passwordProtected && !password || password !== validatePassword)}>{ isLoading ? <LoadingSpinnerInline inverted /> : t('Create pad') }</button>
        { errorMessage && <ErrorMessage>{ errorMessage }</ErrorMessage> }
    </Form>);
}
