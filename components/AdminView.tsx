
import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Trash2,
  Edit,
  Search,
  X,
  Save,
  ShieldCheck,
  User as UserIcon,
  Mail,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  Key,
  Eye,
  EyeOff,
  Users,
  UserCog,
  Lock,
  Unlock,
  Info
} from 'lucide-react';
import { User, UserRole } from '@/lib/types';

interface ApiUser {
  id: number;
  username: string;
  name: string;
  email: string | null;
  role: string;
  active: boolean;
  createdAt: string | null;
  lastLogin: string | null;
  avatar?: string;
}

interface FormData extends Partial<User> {
  username?: string;
  password?: string;
  confirmPassword?: string;
}

const AdminView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const apiUsers: ApiUser[] = await response.json();
        const mappedUsers: User[] = apiUsers.map(u => ({
          id: String(u.id),
          username: u.username,
          name: u.name,
          email: u.email || '',
          role: u.role as UserRole,
          active: u.active,
          passwordHash: '',
          avatar: u.avatar,
          lastLogin: u.lastLogin || undefined
        }));
        setUsers(mappedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.USER,
    active: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.active).length;
    const admins = users.filter(u => u.role === UserRole.ADMIN).length;
    const regularUsers = users.filter(u => u.role === UserRole.USER).length;
    return { total, active, admins, regularUsers };
  }, [users]);

  const handleOpenModal = (user?: User) => {
    setFormErrors({});
    setShowPassword(false);
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        name: user.name,
        email: user.email,
        password: '',
        confirmPassword: '',
        role: user.role,
        active: user.active
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        name: '',
        email: '',
        password: 'sotkon2025',
        confirmPassword: 'sotkon2025',
        role: UserRole.USER,
        active: true
      });
    }
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (!editingUser && !formData.username?.trim()) {
      errors.username = 'Username é obrigatório';
    }

    if (!editingUser && formData.password && formData.password.length < 6) {
      errors.password = 'Password deve ter pelo menos 6 caracteres';
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords não coincidem';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem a certeza que deseja revogar o acesso deste utilizador?')) {
      try {
        const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setUsers(prev => prev.filter(u => u.id !== id));
        } else {
          const error = await response.json();
          alert(error.error || 'Erro ao eliminar utilizador');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Erro ao eliminar utilizador');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (editingUser) {
        const updateData: Record<string, unknown> = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          active: formData.active
        };

        // Only include password if provided
        if (formData.password && formData.password.length > 0) {
          updateData.password = formData.password;
        }

        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        if (response.ok) {
          await fetchUsers();
        } else {
          const error = await response.json();
          alert(error.error || 'Erro ao atualizar utilizador');
          return;
        }
      } else {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password || 'sotkon2025',
            name: formData.name,
            email: formData.email,
            role: formData.role,
            active: formData.active
          })
        });
        if (response.ok) {
          await fetchUsers();
        } else {
          const error = await response.json();
          alert(error.error || 'Erro ao criar utilizador');
          return;
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Erro ao guardar utilizador');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 h-full overflow-y-auto pb-32">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Gestão de Utilizadores</h2>
          <p className="text-gray-500 font-medium">Administração de contas e níveis de acesso ao ecossistema SOTKON.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-3 font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <UserPlus size={18} /> Adicionar Utilizador
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
            <Users size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{stats.total}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Utilizadores</p>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{stats.active}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contas Activas</p>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-600/10 flex items-center justify-center text-rose-500">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{stats.admins}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Administradores</p>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600/10 flex items-center justify-center text-amber-500">
            <UserCog size={24} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{stats.regularUsers}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Utilizadores</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Pesquisar por nome, email ou username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all font-medium"
        />
      </div>

      {/* Users Table */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#333] bg-[#222]/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Utilizador</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Username</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Nível de Acesso</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Estado</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Último Acesso</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <Loader2 className="animate-spin text-blue-500 mx-auto" size={32} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-gray-600 italic">
                    Nenhum utilizador registado na base de dados.
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center font-bold text-xs border border-blue-600/20">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white uppercase">{user.name}</div>
                        <div className="text-[10px] text-gray-500 lowercase font-medium">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-xs font-mono text-gray-400 bg-[#0f0f0f] px-3 py-1 rounded-lg">
                      {user.username}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${
                      user.role === UserRole.ADMIN
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                        : user.role === UserRole.USER
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
                          : 'bg-gray-500/10 border-gray-500/30 text-gray-500'
                    }`}>
                      {user.role === UserRole.ADMIN && <ShieldAlert size={10} />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      {user.active ? (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : (
                        <XCircle size={14} className="text-gray-600" />
                      )}
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        user.active ? 'text-emerald-500' : 'text-gray-600'
                      }`}>
                        {user.active ? 'ACTIVO' : 'SUSPENSO'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <div className="text-xs font-mono text-gray-500">
                      {user.lastLogin?.includes('T')
                        ? new Date(user.lastLogin).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : user.lastLogin || 'Nunca'}
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-gray-400 hover:text-blue-500 bg-[#252525] rounded-lg border border-[#333] hover:border-blue-500/50 transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-gray-400 hover:text-rose-500 bg-[#252525] rounded-lg border border-[#333] hover:border-rose-500/50 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/10 flex items-center justify-center text-rose-500">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-tight">Administrador (ADMIN)</h4>
              <p className="text-[10px] text-gray-500">Acesso total ao sistema</p>
            </div>
          </div>
          <ul className="space-y-2 pl-4">
            <li className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle2 size={12} className="text-emerald-500" /> Dashboard
            </li>
            <li className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle2 size={12} className="text-emerald-500" /> Encomendas (criar, editar, eliminar)
            </li>
            <li className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle2 size={12} className="text-emerald-500" /> Planeamento
            </li>
            <li className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle2 size={12} className="text-emerald-500" /> Todas as outras secções
            </li>
            <li className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle2 size={12} className="text-emerald-500" /> Gestão de Utilizadores
            </li>
          </ul>
        </div>

        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
              <UserCog size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-tight">Utilizador (USER)</h4>
              <p className="text-[10px] text-gray-500">Acesso às áreas operacionais</p>
            </div>
          </div>
          <ul className="space-y-2 pl-4">
            <li className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle2 size={12} className="text-emerald-500" /> Dashboard
            </li>
            <li className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle2 size={12} className="text-emerald-500" /> Encomendas (criar, editar, eliminar)
            </li>
            <li className="flex items-center gap-2 text-xs text-gray-400">
              <CheckCircle2 size={12} className="text-emerald-500" /> Planeamento (criar, editar, eliminar)
            </li>
            <li className="flex items-center gap-2 text-xs text-gray-400">
              <XCircle size={12} className="text-rose-500" /> Outras secções (não visível no menu)
            </li>
            <li className="flex items-center gap-2 text-xs text-gray-400">
              <XCircle size={12} className="text-rose-500" /> Gestão de Utilizadores (não visível no menu)
            </li>
          </ul>
        </div>
      </div>

      {/* Admin Privilege Warning */}
      <div className="flex items-center gap-4 bg-rose-900/10 border border-rose-500/20 p-6 rounded-2xl">
        <div className="bg-rose-600 p-3 rounded-xl text-white">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black text-white uppercase tracking-tight">Segurança de Sistema</h4>
          <p className="text-xs text-rose-400 font-medium">Apenas utilizadores com nível ADMIN podem aceder a este portal e modificar permissões de utilizadores.</p>
        </div>
      </div>

      {/* User Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1a1a1a] border border-[#333] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-[#333] flex justify-between items-center bg-[#222]/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
                  {editingUser ? <Edit size={24} /> : <UserPlus size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {editingUser ? 'Perfil de Utilizador' : 'Novo Utilizador'}
                  </h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Defina as credenciais e o nível de autoridade</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-10 space-y-8">
              <div className="space-y-6">
                {/* Name and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <UserIcon size={12} /> Nome Completo
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full bg-[#121212] border rounded-xl px-5 py-3.5 text-sm text-white focus:border-blue-600 outline-none transition-all ${formErrors.name ? 'border-rose-500' : 'border-[#333]'}`}
                      placeholder="Ex: Maria Pereira"
                    />
                    {formErrors.name && <p className="text-rose-500 text-[10px] ml-1">{formErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Mail size={12} /> Email Institucional
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-[#121212] border border-[#333] rounded-xl px-5 py-3.5 text-sm text-white focus:border-blue-600 outline-none transition-all"
                      placeholder="user@sotkon.pt"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <UserIcon size={12} /> Username
                  </label>
                  <input
                    required={!editingUser}
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                    disabled={!!editingUser}
                    className={`w-full bg-[#121212] border rounded-xl px-5 py-3.5 text-sm text-white focus:border-blue-600 outline-none transition-all font-mono ${formErrors.username ? 'border-rose-500' : 'border-[#333]'} ${editingUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="username"
                  />
                  {formErrors.username && <p className="text-rose-500 text-[10px] ml-1">{formErrors.username}</p>}
                  {editingUser && <p className="text-gray-600 text-[10px] ml-1">Username não pode ser alterado</p>}
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Key size={12} /> {editingUser ? 'Nova Password (opcional)' : 'Password'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className={`w-full bg-[#121212] border rounded-xl px-5 py-3.5 pr-12 text-sm text-white focus:border-blue-600 outline-none transition-all ${formErrors.password ? 'border-rose-500' : 'border-[#333]'}`}
                        placeholder={editingUser ? 'Deixe vazio para manter' : 'Min. 6 caracteres'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {formErrors.password && <p className="text-rose-500 text-[10px] ml-1">{formErrors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Key size={12} /> Confirmar Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className={`w-full bg-[#121212] border rounded-xl px-5 py-3.5 text-sm text-white focus:border-blue-600 outline-none transition-all ${formErrors.confirmPassword ? 'border-rose-500' : 'border-[#333]'}`}
                      placeholder="Repita a password"
                    />
                    {formErrors.confirmPassword && <p className="text-rose-500 text-[10px] ml-1">{formErrors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Role and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nível de Acesso</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, role: UserRole.USER})}
                        className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 border ${
                          formData.role === UserRole.USER
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                            : 'bg-[#121212] text-gray-500 border-[#333] hover:border-blue-600/50'
                        }`}
                      >
                        <UserCog size={14} /> User
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, role: UserRole.ADMIN})}
                        className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 border ${
                          formData.role === UserRole.ADMIN
                            ? 'bg-rose-600 text-white border-rose-600 shadow-lg'
                            : 'bg-[#121212] text-gray-500 border-[#333] hover:border-rose-600/50'
                        }`}
                      >
                        <ShieldAlert size={14} /> Admin
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Estado da Conta</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, active: true})}
                        className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 border ${
                          formData.active
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg'
                            : 'bg-[#121212] text-gray-500 border-[#333] hover:border-emerald-600/50'
                        }`}
                      >
                        <Unlock size={14} /> Activo
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, active: false})}
                        className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 border ${
                          !formData.active
                            ? 'bg-rose-600 text-white border-rose-600 shadow-lg'
                            : 'bg-[#121212] text-gray-500 border-[#333] hover:border-rose-600/50'
                        }`}
                      >
                        <Lock size={14} /> Suspenso
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info box for new users */}
                {!editingUser && (
                  <div className="flex items-start gap-3 bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
                    <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-400">
                      A password padrão é <code className="bg-blue-900/30 px-2 py-0.5 rounded">sotkon2025</code>.
                      Recomende ao utilizador que altere a password no primeiro acesso.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-8 py-4 bg-[#252525] hover:bg-[#333] text-gray-400 hover:text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/20"
                >
                  <Save size={18} /> {editingUser ? 'Actualizar Conta' : 'Criar Utilizador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
