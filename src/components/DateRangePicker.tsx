import { useState, useRef, useEffect } from 'react';
import { format, parseISO, isSameDay, isAfter, isBefore, addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiX } from 'react-icons/fi';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DateRangePicker({ 
  startDate, 
  endDate, 
  onDateChange, 
  placeholder = "Seleccionar fechas",
  className = ""
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempStartDate('');
    setTempEndDate('');
    onDateChange('', '');
    setIsOpen(false);
  };

  const handleQuickSelect = (days: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const end = new Date();
    const start = subDays(end, days - 1);
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    setTempStartDate(startStr);
    setTempEndDate(endStr);
    onDateChange(startStr, endStr);
    setIsOpen(false);
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(dateStr);
      setTempEndDate('');
    } else {
      if (isAfter(date, parseISO(tempStartDate))) {
        setTempEndDate(dateStr);
      } else {
        setTempStartDate(dateStr);
        setTempEndDate('');
      }
    }
  };

  const handleApply = () => {
    onDateChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const nextMonth = () => {
    setCurrentMonth(addDays(startOfMonth(currentMonth), 32));
  };

  const prevMonth = () => {
    setCurrentMonth(subDays(startOfMonth(currentMonth), 1));
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = [];
    
    // Añadir días del mes anterior para completar la primera semana
    const firstDayOfWeek = start.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(subDays(start, i + 1));
    }
    
    // Añadir días del mes actual
    let current = start;
    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }
    
    // Añadir días del mes siguiente para completar la última semana
    const lastDayOfWeek = end.getDay();
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      days.push(addDays(end, i));
    }
    
    return days;
  };

  const isInRange = (date: Date) => {
    if (!tempStartDate || !tempEndDate) return false;
    const start = parseISO(tempStartDate);
    const end = parseISO(tempEndDate);
    return isAfter(date, start) && isBefore(date, end);
  };

  const isSelected = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return dateStr === tempStartDate || dateStr === tempEndDate;
  };

  const displayText = () => {
    if (startDate && endDate) {
      return `${format(parseISO(startDate), 'dd/MM/yyyy')} - ${format(parseISO(endDate), 'dd/MM/yyyy')}`;
    }
    return placeholder;
  };

  const days = getDaysInMonth();

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div 
        className="flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        onClick={handleToggle}
      >
        <span className={`${startDate && endDate ? 'text-gray-900' : 'text-gray-500'}`}>
          {displayText()}
        </span>
        <div className="flex items-center space-x-2">
          {(startDate || endDate) && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Seleccionar Rango de Fechas</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Quick Select Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={handleQuickSelect(7)}
                className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Últimos 7 días
              </button>
              <button
                onClick={handleQuickSelect(30)}
                className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Últimos 30 días
              </button>
              <button
                onClick={handleQuickSelect(90)}
                className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Últimos 90 días
              </button>
              <button
                onClick={handleQuickSelect(365)}
                className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Último año
              </button>
            </div>

            {/* Calendar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={prevMonth}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h4 className="text-lg font-semibold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h4>
                <button
                  onClick={nextMonth}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleDateClick(day)}
                      className={`
                        w-10 h-10 text-sm rounded-lg transition-colors
                        ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900 hover:bg-gray-100'}
                        ${isToday ? 'bg-blue-100 text-blue-700 font-semibold' : ''}
                        ${isInRange(day) ? 'bg-blue-100' : ''}
                        ${isSelected(day) ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                      `}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Range Display */}
            {(tempStartDate || tempEndDate) && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <div>Desde: {tempStartDate ? format(parseISO(tempStartDate), 'dd/MM/yyyy') : 'No seleccionado'}</div>
                  <div>Hasta: {tempEndDate ? format(parseISO(tempEndDate), 'dd/MM/yyyy') : 'No seleccionado'}</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              {tempStartDate && tempEndDate && (
                <button
                  onClick={handleApply}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Aplicar Selección
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
