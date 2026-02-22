
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Booking, BookingStatus, Customer } from '../services/types';

const Values: React.FC = () => {
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [bookingsData, customersData] = await Promise.all([
        api.getBookings(),
        api.getCustomers(),
      ]);

      setConfirmedBookings(bookingsData.filter(b => b.status === BookingStatus.CONFIRMED));
      setPendingBookings(bookingsData.filter(b => b.status === BookingStatus.PENDING));
      setCustomers(customersData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalConfirmed = confirmedBookings.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalPending = pendingBookings.reduce((sum, item) => sum + (item.price || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getCustomerName = (id: string) => {
    return customers.find(c => c.id === id)?.name || 'Cliente Desconhecido';
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse text-sm uppercase tracking-widest">Calculando valores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Resumo Financeiro</h2>
          <p className="text-sm text-slate-500">Análise de valores dos processos confirmados.</p>
        </div>
      </div>

      {/* Cards de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Confirmado */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white shadow-lg shadow-brand-100 transform hover:scale-[1.01] transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <i className="fas fa-coins text-8xl"></i>
          </div>
          <p className="text-brand-100 font-bold text-xs uppercase tracking-[0.2em] mb-2">Total Confirmado</p>
          <h3 className="text-4xl font-black mb-1">{formatCurrency(totalConfirmed)}</h3>
          <p className="text-sm opacity-80 font-medium">Soma de {confirmedBookings.length} processos</p>
          <div className="mt-6 pt-4 border-t border-white/20 flex items-center gap-2 text-xs font-bold bg-white/10 w-fit px-3 py-1.5 rounded-lg">
             <i className="fas fa-check-circle"></i> Faturação Garantida
          </div>
        </div>

        {/* Card Pendente (Informativo) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <i className="fas fa-clock text-8xl text-amber-500"></i>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mb-2">Potencial (Pendente)</p>
          <h3 className="text-4xl font-black text-slate-700 mb-1">{formatCurrency(totalPending)}</h3>
          <p className="text-sm text-slate-400 font-medium">Soma de {pendingBookings.length} processos em aberto</p>
          <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 w-fit px-3 py-1.5 rounded-lg">
             <i className="fas fa-hourglass-half"></i> A aguardar confirmação
          </div>
        </div>
      </div>

      {/* Tabela de Detalhes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <i className="fas fa-file-invoice-dollar text-brand-500"></i>
            Detalhe dos Processos Confirmados
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Data Evento</th>
                <th className="px-6 py-3">Evento</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {confirmedBookings.length > 0 ? (
                confirmedBookings
                  .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                  .map((booking) => (
                  <tr key={booking.id} className="hover:bg-brand-50/10 transition-colors">
                    <td className="px-6 py-3 text-sm text-slate-600 font-medium">
                      {new Date(booking.start_date).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-sm font-bold text-slate-700">{booking.event_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">#{booking.id}</p>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-600">
                      {getCustomerName(booking.customer_id)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded text-sm">
                        {formatCurrency(booking.price)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                    Sem processos confirmados registados.
                  </td>
                </tr>
              )}
            </tbody>
            {confirmedBookings.length > 0 && (
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-bold text-slate-600 text-xs uppercase tracking-wider">
                    Total Confirmado
                  </td>
                  <td className="px-6 py-4 text-right font-black text-brand-700 text-lg">
                    {formatCurrency(totalConfirmed)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default Values;
