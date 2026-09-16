import React, { useState, useContext } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemeContext } from '../context/themeContext';
import { AuthContext } from '../context/authContext';
import DropdownSelect from '../components/dropdownSelect';
import { API_BASE } from '../constants/apiConfig';

const FACULTIES = ['CIT'];

const COURSES_BY_FACULTY = {
  CIT: [
    'Bachelor of Science in Information Technology',
    'Bachelor of Science in Computer Technology',
    'Bachelor of Science in Software Engineering',
    'Bachelor of Science in Computer Science',
    'Bachelor of Science in Cyber Security and Computer Forensic',
  ],
};

const YEARS = ['1', '2', '3', '4'];

export default function ProfileSetupScreen() {
  const { theme, activeMode } = useContext(ThemeContext);
  const { user, updateUser } = useContext(AuthContext);

  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = ['name', 'faculty', 'course', 'year'];
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const availableCourses = faculty
    ? COURSES_BY_FACULTY[faculty] || []
    : [];

  function validateCurrentStep() {
    if (currentStep === 'name' && !name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (currentStep === 'faculty' && !faculty) {
      setError('Select your faculty');
      return false;
    }
    if (currentStep === 'course' && !course) {
      setError('Select your course');
      return false;
    }
    if (currentStep === 'year' && !year) {
      setError('Select your year of study');
      return false;
    }
    return true;
  }

  function handleBack() {
    if (stepIndex === 0) return;
    setError('');
    setStepIndex((i) => i - 1);
  }

  async function handleNext() {
    if (!validateCurrentStep()) return;
    setError('');

    if (!isLastStep) {
      setStepIndex((i) => i + 1);
      return;
    }

    setLoading(true);
    try {  
      const response = await fetch(`${API_BASE}/setupProfile.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          faculty,
          course,
          year_of_study: parseInt(year, 10),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || result.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      setLoading(false);
      // RootStack's conditional render switches to MainTabs automatically
      // once profile_completed flips to 1 in context — no navigation call needed
      await updateUser({
        name: name.trim(),
        faculty,
        course,
        year_of_study: parseInt(year, 10),
        profile_completed: 1,
      });
    } catch (err) {
      setLoading(false);
      setError('Network error — check your connection');
    }
  }

  const inputStyle = {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: error ? '#ef4444' : theme.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: theme.text,
    fontSize: 15,
  };

  const labelStyle = {
    color: theme.subtext,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  };

  return (
    <>
      <StatusBar
        backgroundColor={theme.bg}
        barStyle={activeMode === 'light' ? 'dark-content' : 'light-content'}
      />
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={{ flex: 1, backgroundColor: theme.bg }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, paddingHorizontal: 24 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{ marginTop: 60, marginBottom: 32 }}>
            <Text
              style={{
                color: theme.text,
                fontSize: 26,
                fontWeight: '900',
                marginBottom: 8,
              }}
            >
              Set Up Your Profile
            </Text>
            <Text style={{ color: theme.subtext, fontSize: 14 }}>
              This helps us load your timetable and updates
            </Text>
          </View>

          {/* Progress dots */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: 32,
              gap: 8,
            }}
          >
            {steps.map((s, i) => (
              <View
                key={s}
                style={{
                  width: i === stepIndex ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    i <= stepIndex ? theme.accent : theme.border,
                }}
              />
            ))}
          </View>

          {currentStep === 'name' && (
            <>
              <Text style={labelStyle}>Full Name</Text>
              <TextInput
                style={inputStyle}
                placeholder="e.g. Peter Parker"
                placeholderTextColor={theme.subtext}
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (error) setError('');
                }}
                autoCapitalize="words"
                autoFocus
              />
            </>
          )}

          {currentStep === 'faculty' && (
            <DropdownSelect
              label="Faculty"
              value={faculty}
              options={FACULTIES}
              placeholder="Select your faculty"
              onSelect={(val) => {
                setFaculty(val);
                setCourse(''); // reset dependent field
                if (error) setError('');
              }}
            />
          )}

          {currentStep === 'course' && (
            <DropdownSelect
              label="Course"
              value={course}
              options={availableCourses}
              placeholder="Select your course"
              onSelect={(val) => {
                setCourse(val);
                if (error) setError('');
              }}
            />
          )}

          {currentStep === 'year' && (
            <DropdownSelect
              label="Year of Study"
              value={year ? `Year ${year}` : ''}
              options={YEARS.map((y) => `Year ${y}`)}
              placeholder="Select your year"
              onSelect={(val) => {
                setYear(val.replace('Year ', ''));
                if (error) setError('');
              }}
            />
          )}

          {!!error && (
            <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>
              {error}
            </Text>
          )}

          <View style={{ flexDirection: 'row', marginTop: 32, gap: 12 }}>
            {stepIndex > 0 && (
              <TouchableOpacity
                onPress={handleBack}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: theme.text,
                    fontWeight: '600',
                    fontSize: 15,
                  }}
                >
                  Back
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleNext}
              disabled={loading}
              style={{
                flex: 2,
                backgroundColor: theme.accent,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}
                >
                  {isLastStep ? 'Finish Setup' : 'Next'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}