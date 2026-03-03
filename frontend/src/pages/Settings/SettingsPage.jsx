import React, { useState } from 'react';
import { Store, DollarSign, Receipt, Printer, Users, Shield, Bell, Moon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { useSettingsStore } from '../../store';

const SettingsPage = () => {
  const settings = useSettingsStore();
  const [activeTab, setActiveTab] = useState('store');

  const tabs = [
    { id: 'store', label: 'Store Info', icon: Store },
    { id: 'currency', label: 'Currency & Tax', icon: DollarSign },
    { id: 'receipt', label: 'Receipt', icon: Receipt },
    { id: 'printer', label: 'Printer', icon: Printer },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your POS system configuration</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-lg shadow p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          {activeTab === 'store' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Store Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      value={settings.storeName}
                      onChange={(e) => settings.updateStoreInfo({ storeName: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="storeAddress">Address</Label>
                    <Input
                      id="storeAddress"
                      value={settings.storeAddress}
                      onChange={(e) => settings.updateStoreInfo({ storeAddress: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="storePhone">Phone</Label>
                      <Input
                        id="storePhone"
                        value={settings.storePhone}
                        onChange={(e) => settings.updateStoreInfo({ storePhone: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="storeEmail">Email</Label>
                      <Input
                        id="storeEmail"
                        type="email"
                        value={settings.storeEmail}
                        onChange={(e) => settings.updateStoreInfo({ storeEmail: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t">
                <Button>Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === 'currency' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Currency & Tax Settings</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <select
                        id="currency"
                        value={settings.currency}
                        onChange={(e) => settings.updateStoreInfo({ currency: e.target.value })}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="PKR">PKR - Pakistani Rupee</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="currencySymbol">Currency Symbol</Label>
                      <Input
                        id="currencySymbol"
                        value={settings.currencySymbol}
                        onChange={(e) => settings.updateStoreInfo({ currencySymbol: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="taxEnabled"
                      checked={settings.taxEnabled}
                      onChange={(e) => settings.updateTaxSettings({ taxEnabled: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <Label htmlFor="taxEnabled" className="cursor-pointer">
                      Enable Tax Calculation
                    </Label>
                  </div>

                  {settings.taxEnabled && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="taxRate">Tax Rate (%)</Label>
                          <Input
                            id="taxRate"
                            type="number"
                            value={settings.taxRate}
                            onChange={(e) => settings.updateTaxSettings({ taxRate: parseFloat(e.target.value) })}
                            className="mt-2"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="taxLabel">Tax Label</Label>
                          <Input
                            id="taxLabel"
                            value={settings.taxLabel}
                            onChange={(e) => settings.updateTaxSettings({ taxLabel: e.target.value })}
                            className="mt-2"
                            placeholder="VAT, GST, Sales Tax"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="pt-6 border-t">
                <Button>Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Receipt Settings</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="receiptHeader">Receipt Header</Label>
                    <Input
                      id="receiptHeader"
                      value={settings.receiptHeader}
                      onChange={(e) => settings.updateReceiptSettings({ receiptHeader: e.target.value })}
                      className="mt-2"
                      placeholder="Thank you for your purchase!"
                    />
                  </div>
                  <div>
                    <Label htmlFor="receiptFooter">Receipt Footer</Label>
                    <Input
                      id="receiptFooter"
                      value={settings.receiptFooter}
                      onChange={(e) => settings.updateReceiptSettings({ receiptFooter: e.target.value })}
                      className="mt-2"
                      placeholder="Please come again"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="showLogo"
                      checked={settings.showLogo}
                      onChange={(e) => settings.updateReceiptSettings({ showLogo: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <Label htmlFor="showLogo" className="cursor-pointer">
                      Show Logo on Receipt
                    </Label>
                  </div>
                </div>
              </div>

              {/* Receipt Preview */}
              <div className="border rounded-lg p-6 bg-white">
                <h3 className="font-semibold text-gray-900 mb-4">Receipt Preview</h3>
                <div className="max-w-sm mx-auto bg-white border-2 border-dashed border-gray-300 p-6 font-mono text-sm">
                  <div className="text-center mb-4">
                    {settings.showLogo && <div className="text-3xl mb-2">🏪</div>}
                    <div className="font-bold text-lg">{settings.storeName}</div>
                    <div className="text-xs text-gray-600 mt-1">{settings.receiptHeader}</div>
                  </div>
                  <div className="border-t border-b border-dashed border-gray-400 py-3 my-3">
                    <div className="flex justify-between mb-1">
                      <span>Burger Deluxe x1</span>
                      <span>$12.99</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Espresso x2</span>
                      <span>$7.00</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>$19.99</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{settings.taxLabel} ({settings.taxRate}%):</span>
                      <span>$2.00</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t border-dashed border-gray-400 pt-2 mt-2">
                      <span>Total:</span>
                      <span>{settings.currencySymbol}21.99</span>
                    </div>
                  </div>
                  <div className="text-center text-xs text-gray-600 mt-4 border-t border-dashed border-gray-400 pt-3">
                    {settings.receiptFooter}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button>Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Printer Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="printerEnabled"
                      checked={settings.printerEnabled}
                      onChange={(e) => settings.updatePrinterSettings({ printerEnabled: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <Label htmlFor="printerEnabled" className="cursor-pointer">
                      Enable Thermal Printer
                    </Label>
                  </div>

                  {settings.printerEnabled && (
                    <>
                      <div>
                        <Label htmlFor="printerPort">Printer Port</Label>
                        <select
                          id="printerPort"
                          value={settings.thermalPrinterPort}
                          onChange={(e) => settings.updatePrinterSettings({ thermalPrinterPort: e.target.value })}
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="USB001">USB001</option>
                          <option value="COM1">COM1</option>
                          <option value="COM2">COM2</option>
                          <option value="Network">Network Printer</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          id="autoPrint"
                          checked={settings.autoPrint}
                          onChange={(e) => settings.updatePrinterSettings({ autoPrint: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                        <Label htmlFor="autoPrint" className="cursor-pointer">
                          Auto-print receipts after payment
                        </Label>
                      </div>

                      <div className="p-4 border border-gray-300 rounded-lg">
                        <Button variant="outline" className="w-full">
                          Test Printer Connection
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="pt-6 border-t">
                <Button>Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
              <p className="text-gray-600">Manage staff accounts and permissions</p>
              <div className="mt-6">
                <Button>Add New User</Button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
              <p className="text-gray-600">Configure authentication and access control</p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>
              <p className="text-gray-600">Manage alerts and notifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
