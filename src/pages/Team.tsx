
import React from 'react';
import { Users, Plus, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Team = () => {
  const teamMembers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Project Manager',
      avatar: '/placeholder.svg',
      status: 'online'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Designer',
      avatar: '/placeholder.svg',
      status: 'away'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike@example.com',
      role: 'Developer',
      avatar: '/placeholder.svg',
      status: 'online'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600 mt-1">Manage your team members and roles</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{member.name}</h3>
                    <div className={`w-2 h-2 rounded-full ${
                      member.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                  </div>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {member.email}
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Mail className="h-4 w-4 mr-1" />
                  Message
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-gray-600">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">2</div>
              <div className="text-sm text-gray-600">Active Now</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">5</div>
              <div className="text-sm text-gray-600">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">12</div>
              <div className="text-sm text-gray-600">Tasks This Week</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Team;
