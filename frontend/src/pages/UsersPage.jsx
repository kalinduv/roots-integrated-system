import React, { useMemo, useState } from 'react';

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState('staff');
  const [staffList, setStaffList] = useState([
    {
      id: 'ID100',
      name: 'Kasun Perera',
      phone: '0712349086',
      email: 'kasun12@gmail.com',
      status: true,
    },
    {
      id: 'ID101',
      name: 'Pawani Imesha',
      phone: '0716759086',
      email: 'pawani24@gmail.com',
      status: false,
    },
    {
      id: 'ID102',
      name: 'Thanuka Silva',
      phone: '0726767016',
      email: 'thanuka04@gmail.com',
      status: false,
    },
  ]);

  const [adminList, setAdminList] = useState([
    {
      id: 'AD100',
      name: 'Nadeesha Fernando',
      phone: '0771234567',
      email: 'nadeesha@gmail.com',
      status: true,
    },
    {
      id: 'AD101',
      name: 'Sajini Perera',
      phone: '0769876543',
      email: 'sajini@gmail.com',
      status: true,
    },
  ]);

  const activityList = [
    { text: 'New student enrolled in Physics.', time: '1 hour ago' },
    { text: 'New subject ICT added.', time: '2 hours ago' },
    { text: 'Staff meeting scheduled for tomorrow.', time: '3 hours ago' },
    { text: 'Monthly attendance report generated.', time: '4 hours ago' },
  ];

  const currentList = activeTab === 'staff' ? staffList : adminList;

  const totalStudents = 0;
  const totalStaff = staffList.length;
  const activeCourses = 0;
  const attendanceRate = 0;

  const toggleStatus = (id) => {
    if (activeTab === 'staff') {
      setStaffList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: !item.status } : item
        )
      );
    } else {
      setAdminList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: !item.status } : item
        )
      );
    }
  };

  const handleEdit = (item) => {
    alert(`Edit ${item.name}`);
  };

  const handleDelete = (id) => {
    const ok = window.confirm('Are you sure you want to delete this record?');
    if (!ok) return;

    if (activeTab === 'staff') {
      setStaffList((prev) => prev.filter((item) => item.id !== id));
    } else {
      setAdminList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const cardData = useMemo(
    () => [
      { title: 'Total Students', value: totalStudents, extra: '+0%' },
      { title: 'Staff Members', value: totalStaff, extra: '+0%' },
      { title: 'Active Courses', value: activeCourses, extra: '+0%' },
      { title: 'Attendance Rate', value: attendanceRate, extra: '+0%' },
    ],
    [totalStaff]
  );

  return (
    <div className="flex-1 flex flex-col bg-[#f3efee] overflow-hidden">
      <div className="bg-[#E6E1DE] px-8 py-3 border-b border-gray-300">
        <h2 className="text-sm font-medium text-black uppercase">Dashboard</h2>
      </div>

      <div className="px-4 md:px-8 py-8 flex-1 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
          {cardData.map((card) => (
            <div
              key={card.title}
              className="bg-[#4B1D63] text-white rounded-xl px-4 py-4 min-h-[95px] flex flex-col justify-between shadow"
            >
              <div className="text-lg">{card.title}</div>
              <div className="text-2xl font-semibold">{card.value}</div>
              <div className="text-green-300 text-sm">{card.extra}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-[#f8f2f1] border border-gray-400 rounded-md p-4 min-h-[285px]">
            <h3 className="text-center text-xl mb-6">Student Distribution by Stream</h3>

            <div className="flex justify-center items-center h-[210px]">
              <div className="relative w-[220px] h-[220px] rounded-full bg-[conic-gradient(#3b82f6_0deg_130deg,#10b981_130deg_225deg,#f59e0b_225deg_308deg,#8b5cf6_308deg_360deg)]">
                <div className="absolute inset-[28px] bg-[#f8f2f1] rounded-full"></div>

                <div className="absolute -top-2 right-0 text-sm text-[#3b82f6]">
                  Science 36%
                </div>
                <div className="absolute top-20 -left-8 text-sm text-[#10b981]">
                  Arts 26%
                </div>
                <div className="absolute bottom-4 -left-2 text-sm text-[#f59e0b]">
                  Commerce 23%
                </div>
                <div className="absolute bottom-16 -right-10 text-sm text-[#8b5cf6]">
                  Engineering 15%
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#f8f2f1] border border-gray-400 rounded-md min-h-[285px] overflow-hidden">
            <h3 className="text-center text-xl py-4">Recent Activity</h3>

            <div>
              {activityList.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-4 px-5 py-4 border-t border-gray-400"
                >
                  <div className="text-gray-300 text-xl leading-none">★</div>
                  <div>
                    <p className="text-base text-black">{item.text}</p>
                    <p className="text-gray-500 text-sm mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-10 mb-8">
          <button
            onClick={() => setActiveTab('staff')}
            className={`w-[130px] h-[70px] rounded-lg text-white text-2xl shadow ${
              activeTab === 'staff'
                ? 'bg-[#4B1D63]'
                : 'bg-[#6f4785]'
            }`}
          >
            Staff
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`w-[130px] h-[70px] rounded-lg text-white text-2xl shadow ${
              activeTab === 'admin'
                ? 'bg-[#b34cff]'
                : 'bg-[#8b5aa5]'
            }`}
          >
            Admin
          </button>
        </div>

        <div className="bg-[#dddddd] overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-[#bdb7b4] text-black text-left">
                <th className="px-4 py-4 text-lg">Name</th>
                <th className="px-4 py-4 text-lg">Contact Number</th>
                <th className="px-4 py-4 text-lg">E-mail</th>
                <th className="px-4 py-4 text-lg">Status</th>
                <th className="px-4 py-4 text-lg">Action</th>
              </tr>
            </thead>

            <tbody>
              {currentList.map((item) => (
                <tr key={item.id} className="border-t border-gray-400">
                  <td className="px-4 py-4">
                    <div className="text-lg">{item.name}</div>
                    <div className="text-gray-700 text-base">{item.id}</div>
                  </td>

                  <td className="px-4 py-4 text-lg">{item.phone}</td>
                  <td className="px-4 py-4 text-lg">{item.email}</td>

                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleStatus(item.id)}
                      className={`relative inline-block w-12 h-7 rounded-full transition-colors ${
                        item.status ? 'bg-gray-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                          item.status ? 'translate-x-6 left-0' : 'translate-x-1 left-0'
                        }`}
                      ></span>
                    </button>
                  </td>

                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="mr-4 text-gray-700 hover:text-black"
                      title="Edit"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-700 hover:text-red-600"
                      title="Delete"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-center py-5">
            <button className="bg-[#4B1D63] text-white px-10 py-2 rounded-full text-lg">
              View All
            </button>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button className="bg-[#4B1D63] text-white px-14 py-4 rounded-full text-2xl shadow">
            + Add Staff
          </button>
        </div>
      </div>

      <div className="bg-[#e5dfdc] text-center py-4 text-gray-600 text-lg">
        @2026 Roots Education Center. All right reserved
      </div>
    </div>
  );
}