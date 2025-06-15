import React, { useState, useEffect, useCallback } from 'react';
import { Users, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  projects: string[];
  isOwner: boolean;
}

interface ProjectStats {
  totalProjects: number;
  totalTasks: number;
  activeTasks: number;
}

const Team = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    totalTasks: 0,
    activeTasks: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch team members from projects where user is involved
  const fetchTeamMembers = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, owner_id, team_members')
        .or(`owner_id.eq.${user.id},team_members.cs.{${user.email}},team_members.cs.{${user.id}}`);
      
      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        return;
      }

      if (!projects || projects.length === 0) {
        setTeamMembers([]);
        setStats({ totalProjects: 0, totalTasks: 0, activeTasks: 0 });
        return;
      }

      const allMembers = new Set<string>();
      const memberProjects = new Map<string, string[]>();
      const ownerInfo = new Map<string, boolean>();

      projects.forEach(project => {
        if (project.owner_id) {
          const ownerId = project.owner_id;
          console.log('Owner ID:', ownerId);
          allMembers.add(ownerId);
          if (!memberProjects.has(ownerId)) {
            memberProjects.set(ownerId, []);
          }
          memberProjects.get(ownerId)?.push(project.name);
          ownerInfo.set(ownerId, true);
        }

        if (project.team_members && Array.isArray(project.team_members)) {
          project.team_members.forEach(member => {
            allMembers.add(member);
            if (!memberProjects.has(member)) {
              memberProjects.set(member, []);
            }
            memberProjects.get(member)?.push(project.name);
            if (!ownerInfo.has(member)) {
              ownerInfo.set(member, false);
            }
          });
        }
      });

      const teamMembersList: TeamMember[] = [];

      for (const member of Array.from(allMembers)) {
        console.log('Fetching member:', member);
        // Check if member is a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(member);
        
        if (isUuid) {
          try {
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(member);
            
            if (userError || !userData) {
              console.warn(`Failed to fetch user info for UUID: ${member}`, userError);
              teamMembersList.push({
                id: member,
                email: 'unknown@example.com',
                name: ownerInfo.get(member) ? 'Project Owner' : 'Team Member',
                role: ownerInfo.get(member) ? 'Project Owner' : 'Team Member',
                projects: memberProjects.get(member) || [],
                isOwner: ownerInfo.get(member) || false
              });
              continue;
            }

            const fullName = userData.user?.user_metadata?.full_name || 
                             userData.user?.email?.split('@')[0] || 
                             'Unknown User';

            teamMembersList.push({
              id: userData.user?.id || member,
              email: userData.user?.email || 'unknown@example.com',
              name: fullName,
              role: ownerInfo.get(member) ? 'Project Owner' : 'Team Member',
              projects: memberProjects.get(member) || [],
              isOwner: ownerInfo.get(member) || false
            });
          } catch (error) {
            console.error('Error fetching user by UUID:', error);
            teamMembersList.push({
              id: member,
              email: 'unknown@example.com',
              name: ownerInfo.get(member) ? 'Project Owner' : 'Team Member',
              role: ownerInfo.get(member) ? 'Project Owner' : 'Team Member',
              projects: memberProjects.get(member) || [],
              isOwner: ownerInfo.get(member) || false
            });
          }
        } else {
          // Handle non-UUID members (emails)
          teamMembersList.push({
            id: member,
            email: member,
            name: member.split('@')[0],
            role: ownerInfo.get(member) ? 'Project Owner' : 'Team Member',
            projects: memberProjects.get(member) || [],
            isOwner: ownerInfo.get(member) || false
          });
        }
      }

      setTeamMembers(teamMembersList);
      setStats({
        totalProjects: projects.length,
        totalTasks: 0, // Placeholder for task stats
        activeTasks: 0 // Placeholder for task stats
      });

    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load team members on component mount
  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user, fetchTeamMembers]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600 mt-1">Contributors and team members from your projects</p>
        </div>
        <Button onClick={fetchTeamMembers} variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Refresh Team
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading team members...</p>
        </div>
      ) : teamMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{member.name}</h3>
                      {member.isOwner && (
                        <div className="w-2 h-2 rounded-full bg-green-500" title="Project Owner" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {member.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    {member.projects.length} project{member.projects.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {member.projects.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Projects:</p>
                    <div className="flex flex-wrap gap-1">
                      {member.projects.slice(0, 3).map((project, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {project}
                        </span>
                      ))}
                      {member.projects.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{member.projects.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

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
      ) : (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No other team members found</h3>
          <p className="text-gray-600 mb-4">
            You don't have any other contributors in your projects yet. Invite team members to collaborate on your projects.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{teamMembers.length}</div>
              <div className="text-sm text-gray-600">Contributors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {teamMembers.filter(m => m.isOwner).length}
              </div>
              <div className="text-sm text-gray-600">Other Owners</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalProjects}</div>
              <div className="text-sm text-gray-600">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.activeTasks}</div>
              <div className="text-sm text-gray-600">Active Tasks</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Team;