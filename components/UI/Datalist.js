import React, { useState, useRef } from 'react';

import { ServiceTable } from './ServiceTable';

/**
 * An input component that functions as a datalist and can be controlled with arrow keys and mouse clicks.
 *
 * @component
 * @param {string[]} options - An array of Objects for the datalist.
 * @returns {React.JSX.Element} The Datalist component.
 */

function Datalist({ options, callback }) {
    const [value, setValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);
    const datalistRef = useRef(null);

    const handleChange = async (e) => {
        setIsLoading(true);
        setValue(e.target.value);
        await callback(e);
        if (e.target.value !== '') setIsOpen(true);
        setIsLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
            } else {
                const newIndex = Math.min(selectedIndex + 1, options.length - 1);
                setSelectedIndex(newIndex);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (isOpen) {
                const newIndex = Math.max(selectedIndex - 1, -1);
                setSelectedIndex(newIndex);
            }
        } else if (e.key === 'Enter' && isOpen && selectedIndex !== -1) {
            e.preventDefault();
            const selectedOption = options[selectedIndex].display_name;
            setValue(selectedOption);
            setIsOpen(false);
            setSelectedIndex(-1);
            inputRef.current.focus();
        }
    };

    const handleBlur = () => {
        setTimeout(() => {
            setIsOpen(false);
            setSelectedIndex(-1);
        }, 100); // Delay closing the datalist to allow clicking on options
    };

    const handleListItemClick = (selectedOption) => {
        setValue(selectedOption);
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current.focus();
    };

    return (
        <div>
            <input
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                ref={inputRef}
                disabled={isLoading}
            />
            { isOpen && (
                <ServiceTable className="datalist" ref={datalistRef}>
                    <ServiceTable.Body>
                        { options.map((option, index) => (
                            <ServiceTable.Row>
                                <ServiceTable.Cell
                                    key={index}
                                    selected={selectedIndex === index}
                                    // selected={true}
                                    onClick={() => handleListItemClick(option.display_name)}
                                >
                                    { option.display_name }
                                </ServiceTable.Cell>
                            </ServiceTable.Row>
                        )) }
                    </ServiceTable.Body>
                </ServiceTable>
            ) }
        </div>
    );
}

export default Datalist;
