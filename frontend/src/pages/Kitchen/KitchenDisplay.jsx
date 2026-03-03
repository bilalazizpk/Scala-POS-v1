import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, ChefHat, LayoutGrid } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useKitchenOrders, useUpdateItemStatus } from '../../hooks';
import * as signalR from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';

const OrderCard = ({ order, station, onStatusChange }) => {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(order.orderDate).getTime()) / 1000);
      setTimer(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [order.orderDate]);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timer < 300) return 'text-green-600';
    if (timer < 600) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Only show items destined for this station
  const stationItems = order.orderItems?.filter(oi =>
    oi.product?.category?.targetKdsStation?.toLowerCase() === station.toLowerCase() &&
    (oi.status === 'Pending' || oi.status === 'Preparing')
  ) || [];

  if (stationItems.length === 0) return null;

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-750 p-4 border-b border-gray-700 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">#{order.orderNumber}</h3>
            <span className="bg-gray-600 text-xs font-bold px-2 py-1 rounded text-white">{order.orderType}</span>
            {order.tableNumber && <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded text-white">Table {order.tableNumber}</span>}
          </div>
        </div>
        <div className={`text-2xl font-bold ${getTimerColor()} flex items-center`}>
          <Clock className="w-5 h-5 mr-2" />
          {formatTime(timer)}
        </div>
      </div>

      {/* Items */}
      <div className="p-4 flex-1 space-y-3">
        {stationItems.map((item, index) => (
          <div key={item.id || index} className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
            <div className="flex gap-4 items-start">
              <span className="text-xl font-bold text-blue-400">{item.quantity}x</span>
              <div>
                <p className="font-semibold text-lg text-white leading-tight">{item.product?.name || 'Unknown Item'}</p>
                {item.notes && <p className="text-sm text-yellow-500 mt-1 font-medium">Note: {item.notes}</p>}
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">{item.status}</p>
              </div>
            </div>

            {/* Actions for this specific item */}
            <div className="flex flex-col gap-2 shrink-0 ml-4">
              {item.status === 'Pending' && (
                <Button
                  onClick={() => onStatusChange(item.id, 'Preparing')}
                  className="bg-blue-600 hover:bg-blue-700 text-sm py-1 h-auto"
                >
                  Prepare
                </Button>
              )}
              {item.status === 'Preparing' && (
                <Button
                  onClick={() => onStatusChange(item.id, 'Ready')}
                  className="bg-green-600 hover:bg-green-700 text-sm py-1 h-auto"
                >
                  <CheckCircle className="w-4 h-4 mr-1 pb-0.5" /> Ready
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const KitchenDisplay = () => {
  const [station, setStation] = useState('Kitchen');
  const { data: orders = [], isLoading } = useKitchenOrders(station);
  const updateStatus = useUpdateItemStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Connect to SignalR
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5000/hubs/kitchen")
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log("Connected to KitchenHub");
        connection.invoke("JoinStation", station);
      })
      .catch(err => console.error("SignalR Connection Error: ", err));

    connection.on("NewOrder", () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
    });

    connection.on("ItemStatusUpdated", () => {
      queryClient.invalidateQueries({ queryKey: ['kitchenOrders'] });
    });

    return () => {
      connection.invoke("LeaveStation", station).catch(e => console.error(e));
      connection.stop();
    };
  }, [station, queryClient]);

  const handleStatusChange = (itemId, newStatus) => {
    updateStatus.mutate({ itemId, status: newStatus });
  };

  const stations = ['Kitchen', 'Bar', 'Grill', 'Dessert'];

  return (
    <div className="min-h-screen bg-gray-900 p-6 flex flex-col">
      {/* Header Controls */}
      <div className="mb-6 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <ChefHat className="w-10 h-10 text-blue-500" />
            Kitchen Display System
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Real-time order routing by category</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg">
          <LayoutGrid className="text-gray-400 w-5 h-5 ml-2" />
          {stations.map(st => (
            <button
              key={st}
              onClick={() => setStation(st)}
              className={`px-4 py-2 rounded-md font-medium transition ${station === st ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max h-full items-start">
            {/* Just showing orders linearly mapped out */}
            {orders.length === 0 ? (
              <div className="w-full flex justify-center mt-20 text-gray-500 text-xl font-medium">
                No active orders for {station}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full auto-rows-max">
                {orders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    station={station}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
