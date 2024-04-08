import Tippy from "@tippyjs/react";
import dayjs from "dayjs";
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBoolean, useWindowSize } from "usehooks-ts";

import Calendar from "../components/Calendar";
import Footer from "../components/Footer";
import Input from "../components/Input";
import Shortcuts from "../components/Shortcuts";
import { COLORS, DATE_FORMAT, DEFAULT_COLOR, LANGUAGE } from "../constants";
import DatepickerContext from "../contexts/DatepickerContext";
import { formatDate, nextMonth, previousMonth } from "../helpers";
import { Period, DatepickerType, ColorKeys } from "../types";

import { Arrow, VerticalDash } from "./utils";

const Datepicker = forwardRef<HTMLInputElement, DatepickerType>(
    (
        {
            primaryColor = "blue",
            value = null,
            onChange,
            onDayPicked,
            useRange = true,
            showFooter = false,
            showShortcuts = false,
            configs = undefined,
            asSingle = false,
            placeholder = null,
            separator = "~",
            startFrom = null,
            i18n = LANGUAGE,
            disabled = false,
            inputClassName = null,
            containerClassName = null,
            toggleClassName = null,
            toggleIcon = undefined,
            displayFormat = DATE_FORMAT,
            readOnly = false,
            minDate = null,
            maxDate = null,
            dateLooking = "forward",
            disabledDates = null,
            inputId,
            inputName,
            startWeekOn = "sun",
            classNames = undefined,
            popoverDirection = undefined
        },
        outerRef
    ) => {
        // Ref
        const containerRef = useRef<HTMLDivElement | null>(null);
        const calendarContainerRef = useRef<HTMLDivElement | null>(null);
        const arrowRef = useRef<HTMLDivElement | null>(null);

        // State
        const [firstDate, setFirstDate] = useState<dayjs.Dayjs>(
            startFrom && dayjs(startFrom).isValid() ? dayjs(startFrom) : dayjs()
        );
        const [secondDate, setSecondDate] = useState<dayjs.Dayjs>(nextMonth(firstDate));
        const [period, setPeriod] = useState<Period>({
            start: null,
            end: null
        });
        const [dayHover, setDayHover] = useState<string | null>(null);
        const [inputText, setInputText] = useState<string>("");
        const [inputRef, setInputRef] = useState(React.createRef<HTMLInputElement>());

        const {
            value: tipperShow,
            setTrue: setTipperTrue,
            setFalse: setTipperFalse
        } = useBoolean(false);

        // Functions
        const hideDatepicker = useCallback(() => {
            const div = calendarContainerRef.current;
            const arrow = arrowRef.current;
            if (arrow && div && div.classList.contains("block")) {
                div.classList.remove("block");
                div.classList.remove("translate-y-0");
                div.classList.remove("opacity-1");
                div.classList.add("translate-y-4");
                div.classList.add("opacity-0");
                setTimeout(() => {
                    div.classList.remove("bottom-full");
                    div.classList.add("hidden");
                    div.classList.add("mb-2.5");
                    div.classList.add("mt-2.5");
                    setTipperFalse();
                }, 300);
            }
        }, [setTipperFalse]);

        const { height } = useWindowSize();
        const showDatepicker = useCallback(() => {
            const div = calendarContainerRef?.current;
            const input = inputRef.current;
            const arrow = arrowRef?.current;

            if (arrow && div && div.classList.contains("hidden")) {
                div.classList.remove("hidden");
                div.classList.add("block");

                // window.innerWidth === 767
                const popoverOnUp = popoverDirection === "up";
                // const popoverOnDown = popoverDirection === "down";
                const calanderHeight = (input?.getBoundingClientRect().bottom || 0) + 420;
                if (popoverOnUp || height < calanderHeight) {
                    div.classList.add("bottom-full");
                    div.classList.add("mb-2.5");
                    div.classList.remove("mt-2.5");
                }

                setTimeout(() => {
                    div.classList.remove("translate-y-4");
                    div.classList.remove("opacity-0");
                    div.classList.add("translate-y-0");
                    div.classList.add("opacity-1");
                }, 1);
            }
        }, [height, popoverDirection, inputRef]);

        /* Start First */
        const firstGotoDate = useCallback(
            (date: dayjs.Dayjs) => {
                const newDate = dayjs(formatDate(date));
                const reformatDate = dayjs(formatDate(secondDate));
                if (newDate.isSame(reformatDate) || newDate.isAfter(reformatDate)) {
                    setSecondDate(nextMonth(date));
                }
                setFirstDate(date);
            },
            [secondDate]
        );

        const previousMonthFirst = useCallback(() => {
            setFirstDate(previousMonth(firstDate));
        }, [firstDate]);

        const nextMonthFirst = useCallback(() => {
            firstGotoDate(nextMonth(firstDate));
        }, [firstDate, firstGotoDate]);

        const changeFirstMonth = useCallback(
            (month: number) => {
                firstGotoDate(dayjs(`${firstDate.year()}-${month < 10 ? "0" : ""}${month}-01`));
            },
            [firstDate, firstGotoDate]
        );

        const changeFirstYear = useCallback(
            (year: number) => {
                firstGotoDate(dayjs(`${year}-${firstDate.month() + 1}-01`));
            },
            [firstDate, firstGotoDate]
        );
        /* End First */

        /* Start Second */
        const secondGotoDate = useCallback(
            (date: dayjs.Dayjs) => {
                const newDate = dayjs(formatDate(date, displayFormat));
                const reformatDate = dayjs(formatDate(firstDate, displayFormat));
                if (newDate.isSame(reformatDate) || newDate.isBefore(reformatDate)) {
                    setFirstDate(previousMonth(date));
                }
                setSecondDate(date);
            },
            [firstDate, displayFormat]
        );

        const previousMonthSecond = useCallback(() => {
            secondGotoDate(previousMonth(secondDate));
        }, [secondDate, secondGotoDate]);

        const nextMonthSecond = useCallback(() => {
            setSecondDate(nextMonth(secondDate));
        }, [secondDate]);

        const changeSecondMonth = useCallback(
            (month: number) => {
                secondGotoDate(dayjs(`${secondDate.year()}-${month < 10 ? "0" : ""}${month}-01`));
            },
            [secondDate, secondGotoDate]
        );

        const changeSecondYear = useCallback(
            (year: number) => {
                secondGotoDate(dayjs(`${year}-${secondDate.month() + 1}-01`));
            },
            [secondDate, secondGotoDate]
        );
        /* End Second */

        useEffect(() => {
            if (value && value.startDate && value.endDate) {
                const startDate = dayjs(value.startDate);
                const endDate = dayjs(value.endDate);
                const validDate = startDate.isValid() && endDate.isValid();
                const condition =
                    validDate && (startDate.isSame(endDate) || startDate.isBefore(endDate));
                if (condition) {
                    setPeriod({
                        start: formatDate(startDate),
                        end: formatDate(endDate)
                    });
                    setInputText(
                        `${formatDate(startDate, displayFormat)}${
                            asSingle ? "" : ` ${separator} ${formatDate(endDate, displayFormat)}`
                        }`
                    );
                }
            }

            if (value && value.startDate === null && value.endDate === null) {
                setPeriod({
                    start: null,
                    end: null
                });
                setInputText("");
            }
        }, [asSingle, value, displayFormat, separator]);

        useEffect(() => {
            if (startFrom && dayjs(startFrom).isValid()) {
                const startDate = value?.startDate;
                const endDate = value?.endDate;
                if (startDate && dayjs(startDate).isValid()) {
                    setFirstDate(dayjs(startDate));
                    if (!asSingle) {
                        if (
                            endDate &&
                            dayjs(endDate).isValid() &&
                            dayjs(endDate).startOf("month").isAfter(dayjs(startDate))
                        ) {
                            setSecondDate(dayjs(endDate));
                        } else {
                            setSecondDate(nextMonth(dayjs(startDate)));
                        }
                    }
                } else {
                    setFirstDate(dayjs(startFrom));
                    setSecondDate(nextMonth(dayjs(startFrom)));
                }
            }
        }, [asSingle, startFrom, value]);

        useEffect(() => {
            if (tipperShow) showDatepicker();
            else hideDatepicker();
        }, [tipperShow, showDatepicker, hideDatepicker]);

        // Variables
        const safePrimaryColor = useMemo(() => {
            if (COLORS.includes(primaryColor)) {
                return primaryColor as ColorKeys;
            }
            return DEFAULT_COLOR;
        }, [primaryColor]);
        const contextValues = useMemo(() => {
            return {
                asSingle,
                primaryColor: safePrimaryColor,
                configs,
                calendarContainer: calendarContainerRef,
                arrowContainer: arrowRef,
                hideDatepicker,
                showDatepicker,
                period,
                changePeriod: (newPeriod: Period) => setPeriod(newPeriod),
                dayHover,
                changeDayHover: (newDay: string | null) => setDayHover(newDay),
                inputText,
                changeInputText: (newText: string) => setInputText(newText),
                updateFirstDate: (newDate: dayjs.Dayjs) => firstGotoDate(newDate),
                changeDatepickerValue: onChange,
                showFooter,
                placeholder,
                separator,
                i18n,
                value,
                disabled,
                inputClassName,
                containerClassName,
                toggleClassName,
                toggleIcon,
                readOnly,
                displayFormat,
                minDate,
                maxDate,
                dateLooking,
                disabledDates,
                inputId,
                inputName,
                startWeekOn,
                classNames,
                onChange,
                input: inputRef,
                popoverDirection
            };
        }, [
            asSingle,
            safePrimaryColor,
            configs,
            hideDatepicker,
            showDatepicker,
            period,
            dayHover,
            inputText,
            onChange,
            showFooter,
            placeholder,
            separator,
            i18n,
            value,
            disabled,
            inputClassName,
            containerClassName,
            toggleClassName,
            toggleIcon,
            readOnly,
            displayFormat,
            minDate,
            maxDate,
            dateLooking,
            disabledDates,
            inputId,
            inputName,
            startWeekOn,
            classNames,
            inputRef,
            popoverDirection,
            firstGotoDate
        ]);

        const containerClassNameOverload = useMemo(() => {
            const defaultContainerClassName = "relative w-full text-gray-700";
            return typeof containerClassName === "function"
                ? containerClassName(defaultContainerClassName)
                : typeof containerClassName === "string" && containerClassName !== ""
                ? containerClassName
                : defaultContainerClassName;
        }, [containerClassName]);

        return (
            <DatepickerContext.Provider value={contextValues}>
                <div className={containerClassNameOverload} ref={containerRef}>
                    <Tippy
                        interactive
                        onClickOutside={setTipperFalse}
                        appendTo={document?.body}
                        visible={tipperShow}
                        render={props => (
                            <div
                                {...props}
                                className="transition-all ease-out duration-300 z-10 mt-[1px] text-sm lg:text-xs 2xl:text-sm translate-y-4 opacity-0 hidden"
                                ref={calendarContainerRef}
                            >
                                <Arrow
                                    ref={arrowRef}
                                    placement={props["data-placement"] as "top" | "bottom"}
                                />

                                <div className="mt-2.5 shadow-sm border border-gray-300 px-1 py-0.5 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 rounded-lg">
                                    <div className="flex flex-col lg:flex-row py-2">
                                        {showShortcuts && <Shortcuts />}

                                        <div
                                            className={`flex items-stretch flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-1.5 ${
                                                showShortcuts ? "md:pl-2" : "md:pl-1"
                                            } pr-2 lg:pr-1`}
                                        >
                                            <Calendar
                                                date={firstDate}
                                                onClickPrevious={previousMonthFirst}
                                                onClickNext={nextMonthFirst}
                                                onDayPicked={onDayPicked}
                                                changeMonth={changeFirstMonth}
                                                changeYear={changeFirstYear}
                                                minDate={minDate}
                                                maxDate={maxDate}
                                            />

                                            {useRange && (
                                                <>
                                                    <div className="flex items-center">
                                                        <VerticalDash />
                                                    </div>

                                                    <Calendar
                                                        date={secondDate}
                                                        onClickPrevious={previousMonthSecond}
                                                        onClickNext={nextMonthSecond}
                                                        onDayPicked={onDayPicked}
                                                        changeMonth={changeSecondMonth}
                                                        changeYear={changeSecondYear}
                                                        minDate={minDate}
                                                        maxDate={maxDate}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {showFooter && <Footer />}
                                </div>
                            </div>
                        )}
                    >
                        <Input
                            setContextRef={setInputRef}
                            setTipperTrue={setTipperTrue}
                            ref={outerRef}
                        />
                    </Tippy>
                </div>
            </DatepickerContext.Provider>
        );
    }
);
Datepicker.displayName = "Datepicker";

export default Datepicker;
