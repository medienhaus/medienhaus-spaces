import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

import { ServiceTable } from './ServiceTable';
import Form from './Form';

/**
 * An input component that functions as a datalist and can be controlled with arrow keys and mouse clicks.
 *
 * @param {Object[]} options - An array of Objects for the datalist.
 * @param {function} onInputChange - Function to execute when input changes, receives string as the first parameter.
 * @param {function} onSubmit - Function to execute when the form is submitted, receives an array of selected options.
 * @param {Array} keysToDisplay - Array of strings of key values to be displayed as results.
 *
 * @returns {React.JSX.Element} - The Datalist component.
 */

const Row = styled(ServiceTable.Row)`
  &:hover,
  &:focus {
    text-decoration: underline;
  }
`;

const InviteUserForm = styled(Form)`
  display: grid;
  height: 100%;

  > :last-child {
    align-self: end;
  }
`;

export default function DataList({ options, onInputChange, keysToDisplay, onSubmit }) {
    const [value, setValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [selected, setSelected] = useState([]);
    const [checked, setChecked] = useState([]);
    const inputRef = useRef(null);

    const { t } = useTranslation();

    const handleChange = async (e) => {
        if (e.target.value !== '') setIsOpen(true);
        else {
            // if the input is empty we close the datalist
            setIsOpen(false);
        }

        if (!_.isEmpty(checked)) {
            // if an option was checked we update the selected array here.
            // This has the benefit that options don't immediately jump to the bottom when they are being selected,
            // only when the input changes will a checked option jump to the bottom
            setSelected(prevState => [...prevState, ...checked]);
            setChecked([]);
        }

        setValue(e.target.value);
        await onInputChange(e.target.value);
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
            handleSelect(options[selectedIndex]);
            setSelectedIndex(-1);
        }
    };

    const handleSelect = (selectedOption) => {
        setChecked(prevState => {
            if (checked.includes(selectedOption)) {
                // remove option if it is changing from checked to unchecked (therefore already inside the `checked` array
                return prevState.filter(option => selectedOption !== option);
            } else {
                // otherwise add option to the array
                return [...prevState, selectedOption];
            }
        });

        inputRef.current.focus();
    };

    const handleRemove = (option) => {
        setChecked(prevState => prevState.filter(state => state !== option));
        setSelected(prevState => prevState.filter(state => state !== option));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const submit = await onSubmit(checked.concat(selected));

        if (submit) {
            setChecked([]);
            setSelected([]);
        }
    };

    return (
        <InviteUserForm onSubmit={handleSubmit}>
            <>
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    ref={inputRef}
                />
                { (options.length > 0 || selected.length > 0) && (
                    <ServiceTable>
                        <ServiceTable.Body>
                            { isOpen && options.filter(option => {
                                return !selected.some(select => _.isEqual(select, option));
                            }).map((option, index) => {
                                return <DataListRow
                                    key={index}
                                    option={option}
                                    selectedIndex={selectedIndex}
                                    index={index}
                                    keysToDisplay={keysToDisplay}
                                    handleSelect={handleSelect}
                                    isChecked={checked.includes(option)}
                                />;
                            })
                            }
                            { selected.map((item, index) => <Row
                                key={index}
                                selected={selectedIndex === index}
                            >
                                <ServiceTable.Cell>
                                    <input type="checkbox" checked onChange={() => handleRemove(item)} />
                                </ServiceTable.Cell>
                                { keysToDisplay.map((key) => {
                                    return <ServiceTable.Cell
                                        key={key}>
                                        { item[key] }
                                    </ServiceTable.Cell>;
                                }) }
                            </Row>) }
                        </ServiceTable.Body>
                    </ServiceTable>
                ) }
                <button disabled={selected.length === 0 && checked.length === 0}>{ t('invite') }</button>
            </>
        </InviteUserForm>
    );
}

const DataListRow = ({ option, keysToDisplay, handleSelect, selectedIndex, index, isChecked }) => {
    const handleOnCheck = () => {
        handleSelect(option);
    };

    return <Row
        key={index}
        selected={selectedIndex === index}
    >
        <ServiceTable.Cell>
            <input id={index} type="checkbox" checked={isChecked} onChange={handleOnCheck} />
        </ServiceTable.Cell>
        { keysToDisplay.map((key) => {
            return <ServiceTable.Cell
                htmlFor={index}
                key={key}>
                { option[key] }
            </ServiceTable.Cell>;
        }) }
    </Row>;
};
