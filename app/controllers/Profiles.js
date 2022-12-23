const { Profiles, Users, Experience, Companies } = require('../models'),
  { transaction } = require('objection'),
  { filterer } = require('../lib/filters');
module.exports = {

  async getProfiles(
    query,
    pageNumber = 0,
    perPage = 20,
  ) {
    return {
      ...(await filterer(query, Profiles, {
        pageNumber,
        perPage,
        related: query.related,
        search: query.search,
        orderBy: query.orderBy || "id"
      })),
      page: pageNumber,
      per_page: perPage
    };
  },

  async getProfile(id, query) {
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
    let profile = await Profiles.query().findById(id).withGraphFetched(query.related)
    if (!profile) {
      throw {
        message: 'Profile Not Found',
        statusCode: 404
      }
    }
    return profile
  },

  async createProfile(profileBody, userPermissions = {}) {
    const profile = await transaction(
      Profiles,
      async (Profiles) => {
        var newProfile = await Profiles.query().insert({
          ...profileBody
        })
        return newProfile
      }
    )
    return profile
  },

  async editProfile(id, newBody) {
    console.log('newBodynewBodynewBodynewBody', newBody)
    if (!id) {
      throw {
        message: 'ID Not Provided',
        statusCode: 400
      }
    }
    let newUser
    let user = await Users.query().findOne({ stx_address: newBody.stxAddress })
    if (!user) {
      newUser = await Users.query().insert({
        stx_address: newBody.stxAddress
      })
    }
    delete newBody.message
    delete newBody.stxAddress
    delete newBody?.id
    let editedProfile
    let experiences
    let experienceDetail = newBody.experience
    delete newBody.experience
    let profileDetail = await Profiles.query().findOne({ user_id: user.id || newUser.id })
    const profile = await transaction(
      Profiles,
      Experience,
      Companies,
      async (Profiles, Experience, Companies) => {
        if (profileDetail) {
          if (experienceDetail?.length) {
            experiences = await Promise.all(
              experienceDetail.map(async (exp) => {
                let company = exp.company
                delete exp.company
                delete exp.experience_id
                let companyDetails
                if (exp.id) {
                  let id = exp.id
                  delete exp.id
                  if (!company.id) {
                    companyDetails = await Companies.query().insert({ title: company.value, })
                  }
                  return Experience.query().patchAndFetchById(id, { ...exp, employment_type: exp.employment_type?.value, start_month: exp.start_month?.value, end_month: exp.end_month?.value, start_year: exp.start_year?.value, end_year: exp.end_year?.value, company: company.id || companyDetails.id })
                } else {
                  if (!company.id) {
                    companyDetails = await Companies.query().insert({ title: company.value, })
                  }
                  return Experience.query().insert({
                    ...exp,
                    user_id: user.id || newUser.id,
                    company: company.id || companyDetails.id,
                    employment_type: exp.employment_type?.value,
                    start_month: exp.start_month?.value,
                    end_month: exp.end_month?.value,
                    start_year: exp.start_year?.value,
                    end_year: exp.end_year?.value,
                  })
                }
              })
            )
          }
          editedProfile = await Profiles.query().patchAndFetchById(profileDetail?.id, { ...newBody }).withGraphFetched("user");
        } else {
          editedProfile = await Profiles.query().insert({
            ...newBody,
            user_id: user.id || newUser.id,
          }).withGraphFetched("user")
          if (experienceDetail?.length) {
            experiences = await Promise.all(
              experienceDetail.map(async (exp) => {
                let company = exp.company
                delete exp.company
                delete exp.experience_id
                let companyDetails
                if (exp.id) {
                  let id = exp.id
                  delete exp.id
                  if (!company.id) {
                    companyDetails = await Companies.query().insert({ title: company.value })
                  }
                  return Experience.query().patchAndFetchById(id, { ...exp, employment_type: exp.employment_type?.value, start_month: exp.start_month?.value, end_month: exp.end_month?.value, start_year: exp.start_year?.value, end_year: exp.end_year?.value, company: company.id || companyDetails.id })
                } else {
                  if (!company.id) {
                    companyDetails = await Companies.query().insert({ title: company.value, })
                  }
                  return Experience.query().insert({
                    ...exp,
                    user_id: user.id || newUser.id,
                    company: company.id || companyDetails.id,
                    employment_type: exp.employment_type?.value,
                    start_month: exp.start_month?.value,
                    end_month: exp.end_month?.value,
                    start_year: exp.start_year?.value,
                    end_year: exp.end_year?.value,
                  })
                }
              })
            )
          }
        }
        if (!editedProfile) {
          throw {
            message: 'Profile Not Found',
            statusCode: 404
          }
        }
        return editedProfile
      }
    )
    return profile
  },

  async deleteProfile(id) {
    if (!id) {
      throw {
        message: 'No ID Provided',
        statusCode: 400
      }
    }
    let deletedCount = await Profiles.query().patchAndFetchById(parseInt(id), { is_deleted: true })
    await Promise.all(
      Object.keys(Profiles.getRelations()).map((relation) => {
        return deletedCount.$relatedQuery(relation).unrelate()
      })
    )

    if (deletedCount < 1) {
      throw {
        message: 'Profile Not Found',
        statusCode: 404
      }
    }
    return deletedCount
  }
}
