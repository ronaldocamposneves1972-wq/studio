import type { User, Client, Proposal, Product, Bank, TimelineEvent } from './types';
import { PlaceHolderImages } from './placeholder-images';

const avatar1 = PlaceHolderImages.find(i => i.id === 'avatar-1')?.imageUrl || '';
const avatar2 = PlaceHolderImages.find(i => i.id === 'avatar-2')?.imageUrl || '';
const avatar3 = PlaceHolderImages.find(i => i.id === 'avatar-3')?.imageUrl || '';
const avatar4 = PlaceHolderImages.find(i => i.id === 'avatar-4')?.imageUrl || '';

export const users: User[] = [
  { id: 'user-1', name: 'Ana Silva', email: 'ana.silva@email.com', avatarUrl: avatar1, role: 'Admin' },
  { id: 'user-2', name: 'Bruno Costa', email: 'bruno.costa@email.com', avatarUrl: avatar2, role: 'Gestor' },
  { id: 'user-3', name: 'Carlos Dias', email: 'carlos.dias@email.com', avatarUrl: avatar3, role: 'Atendente' },
  { id: 'user-4', name: 'Daniela Lima', email: 'daniela.lima@email.com', avatarUrl: avatar4, role: 'Financeiro' },
];

const timeline: TimelineEvent[] = [
    { id: 't-1', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), activity: 'Proposta #P-12346 enviada', details: 'Valor: R$ 80.000,00', user: { name: 'Carlos Dias', avatarUrl: avatar3 } },
    { id: 't-2', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), activity: 'Documentos recebidos via Quiz', details: 'RG, CNH, Comprov. Renda', user: { name: 'Sistema', avatarUrl: '' } },
    { id: 't-3', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), activity: 'Link do Quiz enviado via WhatsApp', user: { name: 'Carlos Dias', avatarUrl: avatar3 } },
    { id: 't-4', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 5 * 60 * 1000).toISOString(), activity: 'Cliente cadastrado', user: { name: 'Sistema', avatarUrl: '' } },
];

export const clients: Client[] = [
  { id: 'client-1', name: 'Fernanda Rocha', email: 'fernanda.r@email.com', phone: '(11) 98765-4321', status: 'Aprovado', createdAt: '2023-10-01', avatarUrl: 'https://picsum.photos/seed/client1/100/100', income: 12500, salesRep: users[2], timeline: timeline },
  { id: 'client-2', name: 'Gabriel Martins', email: 'gabriel.m@email.com', phone: '(21) 91234-5678', status: 'Em análise', createdAt: '2023-10-05', avatarUrl: 'https://picsum.photos/seed/client2/100/100', income: 7800, salesRep: users[2], timeline: timeline.slice(2) },
  { id: 'client-3', name: 'Heloisa Santos', email: 'heloisa.s@email.com', phone: '(31) 95555-8888', status: 'Pendente', createdAt: '2023-10-10', avatarUrl: 'https://picsum.photos/seed/client3/100/100', income: 4500, salesRep: users[2], timeline: timeline.slice(3) },
  { id: 'client-4', name: 'Igor Almeida', email: 'igor.a@email.com', phone: '(41) 98888-7777', status: 'Novo', createdAt: '2023-10-12', avatarUrl: 'https://picsum.photos/seed/client4/100/100', income: 9200, salesRep: users[2], timeline: [] },
  { id: 'client-5', name: 'Juliana Barbosa', email: 'juliana.b@email.com', phone: '(51) 97777-6666', status: 'Reprovado', createdAt: '2023-09-28', avatarUrl: 'https://picsum.photos/seed/client5/100/100', income: 3200, salesRep: users[2], timeline: timeline.slice(1) },
];

export const proposals: Proposal[] = [
  { id: 'prop-1', clientName: 'Fernanda Rocha', productName: 'Consórcio Imobiliário', value: 350000, status: 'Finalizada', createdAt: '2023-10-02', salesRepName: 'Carlos Dias' },
  { id: 'prop-2', clientName: 'Gabriel Martins', productName: 'Crédito Pessoal', value: 25000, status: 'Em negociação', createdAt: '2023-10-06', salesRepName: 'Carlos Dias' },
  { id: 'prop-3', clientName: 'Heloisa Santos', productName: 'Consórcio Automotivo', value: 80000, status: 'Aberta', createdAt: '2023-10-11', salesRepName: 'Carlos Dias' },
  { id: 'prop-4', clientName: 'Fernanda Rocha', productName: 'Crédito Consignado', value: 50000, status: 'Cancelada', createdAt: '2023-09-20', salesRepName: 'Carlos Dias' },
];

export const products: Product[] = [
    { id: 'prod-1', name: 'Consórcio Imobiliário', type: 'Consórcio', minAmount: 100000, maxAmount: 1000000, interestRate: 0.1, terms: [120, 180, 240], imageUrl: 'https://picsum.photos/seed/house/400/300' },
    { id: 'prod-2', name: 'Consórcio Automotivo', type: 'Consórcio', minAmount: 30000, maxAmount: 250000, interestRate: 0.12, terms: [60, 72, 84], imageUrl: 'https://picsum.photos/seed/car/400/300' },
    { id: 'prod-3', name: 'Crédito Pessoal Rápido', type: 'Crédito', minAmount: 1000, maxAmount: 50000, interestRate: 3.5, terms: [12, 24, 36], imageUrl: 'https://picsum.photos/seed/money/400/300' },
    { id: 'prod-4', name: 'Crédito com Garantia', type: 'Crédito', minAmount: 50000, maxAmount: 500000, interestRate: 1.8, terms: [48, 60, 96], imageUrl: 'https://picsum.photos/seed/credit/400/300' },
];

export const banks: Bank[] = [
    { id: 'bank-1', name: 'Banco Parceiro S.A.', logoUrl: 'https://picsum.photos/seed/bank1/40/40', commissionRate: 2.5, approvedVolume: 1250000, sentVolume: 2000000 },
    { id: 'bank-2', name: 'CrediFácil Financeira', logoUrl: 'https://picsum.photos/seed/bank2/40/40', commissionRate: 3.0, approvedVolume: 850000, sentVolume: 1500000 },
    { id: 'bank-3', name: 'Invest Bank', logoUrl: 'https://picsum.photos/seed/bank3/40/40', commissionRate: 2.2, approvedVolume: 2100000, sentVolume: 2800000 },
];
