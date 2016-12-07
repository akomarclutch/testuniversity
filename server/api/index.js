'use strict';

const Joi = require('joi');

/**
 * ********************************************
 * Test data loaded from local javascript files
 * ********************************************
 */
const Students = require('./../../data/students');
const Courses = require('./../../data/courses');
const Enrollments = require('./../../data/enrollments');

exports.register = (server, options, next) => {

    // for root url
    server.route({
        method: 'GET',
        path: '/',
        handler: (request, reply) => {

            // welcome!
            reply({ message: 'Welcome to Credo University' });
        }
    });

    // for fetching all courses
    server.route({
        method: 'GET',
        path: '/courses',
        config: {
            tags: ['api']
        },
        handler: (request, reply) => {

            // return * form Courses table
            reply({ status: 200, total_count: Courses.length, data: Courses });
        }
    });

    // for fetching course by course_id
    server.route({
        method: 'GET',
        path: '/courses/{course_id}',
        config: {
            tags: ['api'],
            validate: {
                params: {
                    course_id: Joi.number()
                }
            }
        },
        handler: (request, reply) => {

            // find course record matching provided student id
            const course = Courses.filter((c) => {

                return parseInt(request.params.course_id) === c.course_id;
            });

            reply({ status: 200, data: course });
        }
    });

    // for fetching enrollees by course_id
    server.route({
        method: 'GET',
        path: '/courses/{course_id}/students',
        config: {
            tags: ['api'],
            validate: {
                params: {
                    course_id: Joi.number()
                }
            }
        },
        handler: (request, reply) => {

            // find enrollment records matching course id
            const enrollees = Enrollments.filter((enrollee) => {

                return parseInt(request.params.course_id) === enrollee.course_id;
            });

            reply({ status: 200, total_count: enrollees.length, data: enrollees });
        }
    });

    // for fetching enrollee by course_id and student_id
    server.route({
        method: 'GET',
        path: '/courses/{course_id}/students/{student_id}',
        config: {
            tags: ['api'],
            validate: {
                params:{
                    course_id: Joi.number(),
                    student_id: Joi.number()
                }
            }
        },
        handler: (request, reply) => {

            // find enrollment record matching student and course id
            const enrollee = Enrollments.filter((e) => {

                return parseInt(request.params.course_id) === e.course_id && parseInt(request.params.student_id) === e.student_id;
            });

            reply({ status: 200, data: enrollee });
        }
    });

    // for creating new course
    server.route({
        method: 'POST',
        path: '/courses',
        config: {
            tags: ['api'],
            validate: {
                query: {
                    course_name: Joi.string()
                }
            }
        },
        handler: (request, reply) => {

            let course_name = '';

            // set name or provide default
            if (request.query.course_name) {
                course_name = request.query.course_name;
            }
            else {
                course_name = 'TO BE DETERMINED';
            }

            const course = {
                course_id: Courses[Courses.length - 1].course_id + 1,
                course_name
            };

            // write new course to Courses table
            Courses.push(course);

            reply({ status: 201, data: course });
        }
    });

    // for adding new student to course
    server.route({
        method: 'POST',
        path: '/courses/{course_id}/students/{student_id}',
        config: {
            validate: {
                params: {
                    course_id: Joi.number(),
                    student_id: Joi.number()
                }
            },
            tags: ['api']
        },
        handler: (request, reply) => {

            let enrolleeCount = 0;
            let studentAlreadyEnrolled = false;
            let status = 0;
            let data = '';

            // list of courses student is enrolled to keep under limit (5)
            const studentEnrollments = Enrollments.filter((enrollee) => {

                if (enrollee.student_id === parseInt(request.params.student_id)) {
                    return enrollee;
                }
            });

            // count course enrollees and verify student isn't already enrolled'
            for (let i = 0; i < Enrollments.length; ++i){
                if (Enrollments[i].course_id === parseInt(request.params.course_id)) {
                    enrolleeCount++;
                }

                // course id matches, and student id matches
                if (Enrollments[i].course_id === parseInt(request.params.course_id) && Enrollments[i].student_id === parseInt(request.params.student_id)) {
                    studentAlreadyEnrolled = true;
                }
            }

            // set response data
            if (studentAlreadyEnrolled) {
                status = 403;
                data = 'Student is already enrolled in the course';
            }

            else if (studentEnrollments.length >= 5) {
                status = 403;
                data = 'Student is already enrolled in 5 classes';
            }

            else if (enrolleeCount >= 20) {
                status = 403;
                data = 'Class is full, unable to enroll student';
            }

            else {
                const enrollee = {
                    student_id: request.params.student_id,
                    course_id: request.params.course_id
                };

                Enrollments.push(enrollee);
                status = 201;
                data = 'Student successfully enrolled in course';
            }

            reply({ status, data });
        }
    });

    // for removing student from course
    server.route({
        method: 'DELETE',
        path: '/courses/{course_id}/students/{student_id}',
        config: {
            validate: {
                params: {
                    course_id: Joi.number(),
                    student_id: Joi.number()
                }
            },
            tags: ['api']
        },
        handler: (request, reply) => {

            // delete enrollment record for student and course matching respective ids
            Enrollments.forEach((enrollment, index) => {

                if (enrollment.course_id === parseInt(request.params.course_id) && enrollment.student_id === parseInt(request.params.student_id)) {
                    Enrollments.splice(index, 1);
                }
            });

            reply({ status: 204 });
        }
    });

    // for changing a course name
    server.route({
        method: 'PUT',
        path: '/courses/{course_id}/{course_name}',
        config: {
            tags: ['api'],
            validate: {
                params: {
                    course_id: Joi.number(),
                    course_name: Joi.string()
                }
            }
        },
        handler: (request, reply) => {

            // update courses matching provided id
            Courses.forEach((course, index) => {

                if (parseInt(request.params.course_id) === course.course_id) {
                    course.course_name = request.params.course_name;
                }
            });

            reply({ status: 204 });
        }
    });

    // for deleting course by ids
    server.route({
        method: 'DELETE',
        path: '/courses/{course_id}',
        config: {
            tags: ['api'],
            validate: {
                params:{
                    course_id: Joi.number()
                }
            }
        },
        handler: (request, reply) => {

            // remove course with matching id
            Courses.forEach((course, index) => {

                if (parseInt(request.params.course_id) === course.course_id) {
                    Courses.splice(index,1);
                }
            });

            // remove entries from enrollments table
            Enrollments.forEach((enrollment, index) => {

                if (parseInt(request.params.course_id) === enrollment.course_id) {
                    Enrollments.splice(index,1);
                }
            });

            reply({ status: 204 });
        }
    });

    // for fetching all students
    server.route({
        method: 'GET',
        path: '/students',
        config: {
            tags: ['api']
        },
        handler: (request, reply) => {

            // return * from Students table
            reply({ total_count: Students.length, data: Students });
        }
    });

    // for fetching student by student_id
    server.route({
        method: 'GET',
        path: '/students/{student_id}',
        config: {
            tags: ['api'],
            validate: {
                params: {
                    student_id: Joi.number()
                }
            }
        },
        handler: (request, reply) => {

            // return student matching provided id from Students table
            const student = Students.filter((s) => {

                return parseInt(request.params.student_id) === s.student_id;
            });

            reply({ status: 200, data: student });
        }
    });

    // get student's courses by student_id
    server.route({
        method: 'GET',
        path: '/students/{student_id}/courses',
        config: {
            tags: ['api'],
            validate: {
                params: {
                    student_id: Joi.number()
                }
            }
        },
        handler: (request, reply) => {

            // get enrollment records for students matching provided id
            const student = Enrollments.filter((s) => {

                return parseInt(request.params.student_id) === s.student_id;
            });

            reply({ status: 200, total_count: student.length, data: student });
        }
    });

    // for creating students by name
    server.route({
        method: 'POST',
        path: '/students',
        config: {
            tags: ['api'],
            validate: {
                params: {
                    student_name: Joi.string()
                }
            }
        },
        handler: (request, reply) => {

            let student_name;

            // set or provide name for new student
            if (request.query.student_name) {
                student_name = request.query.student_name;
            }
            else {
                student_name = 'TO BE DETERMINED';
            }

            const student = {
                student_id: Students.length + 1,
                student_name
            };

            // write student to students table
            Students.push(student);

            reply({ status: 201, data: student });
        }
    });

    // for deleting students by id
    server.route({
        method: 'DELETE',
        path: '/students/{student_id}',
        config: {
            tags: ['api'],
            validate: {
                params:{
                    student_id: Joi.number()
                }
            }
        },
        handler: (request, reply) => {

            // delete students matching id
            Students.forEach((student, index) => {

                if (parseInt(request.params.student_id) === student.student_id) {
                    Students.splice(index, 1);
                }
            });

            // cleanup any enrollments for deleted student
            Enrollments.forEach((enrollment, index) => {

                if (parseInt(request.params.student_id) === enrollment.student_id) {
                    Enrollments.splice(index, 1);
                }
            });

            reply({ status: 204 });
        }
    });

    next();
};

exports.register.attributes = {
    name: 'api'
};
