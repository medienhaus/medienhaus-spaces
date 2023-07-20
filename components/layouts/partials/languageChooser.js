import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const LanguageSelect = styled.select`
  display: inline;
  width: unset;
  height: 1.3rem;
  padding-left: 1ch;
  margin-bottom: 0;
  background-color: unset;
  background-position: calc(100% - calc(var(--margin) * 0.95)) 70%;
  background-image: url('data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjMwMHB4IiB3aWR0aD0iMzAwcHgiIGZpbGw9InZhcigtLWNvbG9yLWZvcmVncm91bmQpIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB4PSIwcHgiIHk9IjBweCI+PHBvbHlnb24gcG9pbnRzPSI1MCA1Ny4xMyAyMy4xOSAzMC40NiAxNi4xMyAzNy41NSA1MCA3MS4yMyA4My44NiAzNy41NSA3Ni44MSAzMC40NiA1MCA1Ny4xMyI+PC9wb2x5Z29uPjwvc3ZnPg==');
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
