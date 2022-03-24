import { useTranslation } from 'react-i18next';

function LanguageChooser() {
    const { i18n } = useTranslation();

    return (
        <>
            <select
                onChange={(e) => { i18n.changeLanguage(e.target.value); }}
                value={i18n.language}
                style={{ marginBottom: '0', width: '7ch' }}
            >
                <option value="en">EN</option>
                <option value="de">DE</option>
            </select>
        </>
    );
}

export default LanguageChooser;
