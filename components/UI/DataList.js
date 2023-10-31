import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import _ from 'lodash';

import { ServiceTable } from './ServiceTable';

/**
 * An input component that functions as a datalist and can be controlled with arrow keys and mouse clicks.
 *
 * @component
 * @param {Object[]} options - An array of Objects for the datalist.
 * @param {function} onChange - function to execute when input changes, receives string as first parameter.
 * @param {function} onSelect - function to execute when a result from the datalist was selected
 * @param {Array} keysToDisplay - Array of strings of key values to be displayed as results
 * @returns {React.JSX.Element} The Datalist component.
 */

const Row = styled(ServiceTable.Row)`
  &:hover,
  &:focus {
    text-decoration: underline;
  }
`;

export default function DataList({ options, onChange, onSelect, keysToDisplay }) {
    const [value, setValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [selected, setSelected] = useState([]);
    const [checked, setChecked] = useState([]);
    const inputRef = useRef(null);
    console.log(selected);
    const handleChange = async (e) => {
        setIsLoading(true);
        if (!_.isEmpty(checked)) {
            setSelected(prevState => [...prevState, ...checked]);
            setChecked([]);
        }
        setValue(e.target.value);
        await onChange(e.target.value);
        if (e.target.value !== '') setIsOpen(true);
        else {
            // if the input is empty we close the datalist
            setIsOpen(false);
        }
        setIsLoading(false);
    };

    const handleKeyDown = (e) => {
        // Handle keyboard navigation
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isOpen) {
                setIsOpen(true);
            } else {
                setSelectedIndex(Math.min(selectedIndex + 1, options.length - 1));
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (isOpen) {
                const newIndex = Math.max(selectedIndex - 1, -1);
                setSelectedIndex(newIndex);
            }
        } else if (e.key === 'Enter' && isOpen && selectedIndex !== -1) {
            e.preventDefault();
            const selectedOption = options[selectedIndex];
            handleSelect(selectedOption);
        }
    };

    const handleBlur = () => {
        // setTimeout(() => {
        //     setIsOpen(false);
        //     setSelectedIndex(-1);
        // }, 100); // Delay closing the datalist to allow clicking on options
    };

    const handleSelect = (selectedOption) => {
        // onSelect(selectedOption);
        setChecked(prevState => [...prevState, selectedOption]);
        inputRef.current.focus();
    };

    return (
        <>
            <input
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                ref={inputRef}
                disabled={isLoading}
            />
            { (options.length > 0 || selected.length > 0) && (
                <ServiceTable>
                    <ServiceTable.Body>
                        { options.filter(option => {
                            return !selected.some(select => _.isEqual(select, option));
                        }).map((option, index) => {
                            return <DataListRow
                                key={index}
                                option={option}
                                selectedIndex={selectedIndex}
                                index={index}
                                keysToDisplay={keysToDisplay}
                                handleSelect={handleSelect}
                            />;
                        })
                        }

                        { selected.map((item, index) => <Row
                            key={index}
                            selected={selectedIndex === index}
                        >
                            <ServiceTable.Cell>
                                <input type="checkbox" checked />
                            </ServiceTable.Cell>
                            { keysToDisplay.map((key, keyIndex) => {
                                return <ServiceTable.Cell
                                    key={key}>
                                    { item[key] }
                                </ServiceTable.Cell>;
                            }) }
                        </Row>) }
                    </ServiceTable.Body>
                </ServiceTable>
            ) }

        </>
    );
}

const DataListRow = ({ option, keysToDisplay, handleSelect, selectedIndex, index }) => {
    const [isChecked, setIsChecked] = useState(false);

    const handleOnCheck = () => {
        setIsChecked(true);
        handleSelect(option);
    };

    return <Row
        key={index}
        selected={selectedIndex === index}
    >
        <ServiceTable.Cell>
            <input id={index} type="checkbox" checked={isChecked} onChange={handleOnCheck} />
        </ServiceTable.Cell>
        { keysToDisplay.map((key, keyIndex) => {
            return <ServiceTable.Cell
                htmlFor={index}
                key={key}>
                { option[key] }
            </ServiceTable.Cell>;
        }) }
    </Row>;
};
