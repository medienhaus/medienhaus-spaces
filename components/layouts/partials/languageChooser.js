import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const LanguageSelect = styled.select`
  display: inline;
  width: unset;
  height: 1.3rem;
  padding-left: 1ch;
  margin-bottom: 0;
  background-color: unset;
  border: unset;
`;

function LanguageChooser() {
    const { i18n } = useTranslation();

    return (
        <>
            <LanguageSelect
                onChange={(e) => { i18n.changeLanguage(e.target.value); }}
                value={i18n.language}
            >
                <option value="en">en</option>
                <option value="de">de</option>
            </LanguageSelect>
        </>
    );
}

export default LanguageChooser;
